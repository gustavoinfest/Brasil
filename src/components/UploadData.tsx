import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { IndicatorDataset, PREDEFINED_INDICATORS, TeamData } from '../types';

interface UploadDataProps {
  onDataUploaded: (datasets: IndicatorDataset[]) => void;
}

interface UploadResult {
  file: string;
  success: boolean;
  message?: string;
  size?: number;
}

export function UploadData({ onDataUploaded }: UploadDataProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (selectedFile: File): Promise<IndicatorDataset> => {
    return new Promise((resolve, reject) => {
      const isExcel = selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls');
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          let text = '';
          
          if (isExcel) {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            text = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
          } else {
            text = event.target?.result as string;
          }

          const lines = text.split('\n');
          
          let indicatorName = "";
          const indicatorLine = lines.find(l => l.toLowerCase().includes('indicador:'));
          if (indicatorLine) {
            indicatorName = indicatorLine.split(/indicador:/i)[1].replace(/;+$/, '').trim();
          } else if (lines.some(l => l.includes('Relatório CVAT'))) {
            indicatorName = "CVAT";
          } else {
            const firstLines = lines.slice(0, 10).join(' ').toLowerCase();
            const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            const matched = PREDEFINED_INDICATORS.find(i => firstLines.includes(normalizeStr(i.match)));
            if (matched) {
              indicatorName = matched.name;
            } else {
              indicatorName = selectedFile.name.replace(/\.[^/.]+$/, "");
            }
          }

          const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
          
          const matchedIndicator = PREDEFINED_INDICATORS.find(i => 
            normalize(indicatorName).includes(normalize(i.match)) ||
            normalize(i.match).includes(normalize(indicatorName))
          ) || { 
            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
            name: indicatorName, 
            group: 'Outros', 
            match: indicatorName 
          };

          const headerIndex = lines.findIndex(line => {
            const upperLine = line.toUpperCase();
            let matches = 0;
            if (upperLine.includes('CNES')) matches++;
            if (upperLine.includes('ESTABELECIMENTO')) matches++;
            if (upperLine.includes('EQUIPE')) matches++;
            if (upperLine.includes('INE')) matches++;
            return matches >= 2;
          });
          
          if (headerIndex === -1) {
            throw new Error("Cabeçalho da tabela não encontrado. Certifique-se de que é o relatório correto.");
          }

          const csvLines = [];
          for (let i = headerIndex; i < lines.length; i++) {
            if (lines[i].toUpperCase().startsWith('FONTE:')) break;
            if (lines[i].trim() !== '') csvLines.push(lines[i].trim());
          }
          
          const csvString = csvLines.join('\n');

          Papa.parse(csvString, {
            delimiter: ';',
            header: true,
            skipEmptyLines: true,
            complete: (parseResults) => {
              const parsedData = parseResults.data as any[];
              
              if (parsedData.length === 0) {
                reject(new Error("O arquivo está vazio ou não contém dados válidos."));
                return;
              }

              const parseNum = (val: any) => parseFloat(String(val || '0').replace(/\./g, '').replace(',', '.')) || 0;

              const mappedData: TeamData[] = parsedData.map((row, index) => {
                const keys = Object.keys(row);
                const pontuacaoKey = keys.find(k => {
                  const upperK = k.toUpperCase().trim();
                  return upperK.includes('PONTUAÇÃO') || 
                         upperK.includes('RESULTADO') || 
                         upperK.includes('RAZÃO ENTRE O NUMERADOR E DENOMINADOR') ||
                         upperK.includes('SOMATÓRIO DA BOA PRÁTICA');
                });
                
                const pontuacaoRaw = pontuacaoKey ? row[pontuacaoKey] : '0';
                const pontuacao = parseNum(pontuacaoRaw);
                
                const numeradorKey = keys.find(k => k.toUpperCase().trim() === 'NUMERADOR');
                const denominadorKey = keys.find(k => {
                  const upperK = k.toUpperCase().trim();
                  return upperK === 'DENOMINADOR ESTIMADO' || upperK === 'DENOMINADOR INFORMADO' || upperK === 'DENOMINADOR';
                });

                const numerador = numeradorKey ? parseNum(row[numeradorKey]) : 0;
                const denominador = denominadorKey ? parseNum(row[denominadorKey]) : 0;
                
                let status: 'success' | 'warning' | 'danger' = 'danger';
                if (matchedIndicator.id === 'cvat') {
                  if (pontuacao >= 7) status = 'success';
                  else if (pontuacao >= 4) status = 'warning';
                } else {
                  if (pontuacao >= 60) status = 'success';
                  else if (pontuacao >= 40) status = 'warning';
                }

                const fallbackId = (row['CNES'] && row['NOME DA EQUIPE']) 
                  ? `${row['CNES']}-${row['NOME DA EQUIPE']}` 
                  : `eq-${Math.random().toString(36).substr(2, 9)}-${index}`;

                return {
                  id: row['INE'] || fallbackId,
                  cnes: row['CNES'] || '',
                  estabelecimento: row['ESTABELECIMENTO'] || '',
                  tipoEstabelecimento: row['TIPO DO ESTABELECIMENTO'] || '',
                  ine: row['INE'] || '',
                  nomeEquipe: row['NOME DA EQUIPE'] || '',
                  siglaEquipe: row['SIGLA DA EQUIPE'] || '',
                  pontuacao,
                  numerador,
                  denominador,
                  status,
                  raw: row
                };
              });

              resolve({
                id: matchedIndicator.id,
                name: matchedIndicator.name,
                data: mappedData,
                lastUpdated: new Date().toISOString()
              });
            },
            error: (err) => {
              reject(new Error(`Erro na leitura do arquivo: ${err.message}`));
            }
          });
        } catch (err: any) {
          reject(new Error(err.message || "Erro ao processar o arquivo."));
        }
      };
      
      reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));

      if (isExcel) {
        reader.readAsArrayBuffer(selectedFile);
      } else {
        reader.readAsText(selectedFile, 'ISO-8859-1');
      }
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    setResults([]);
    
    const validFiles = Array.from(files).filter(f => {
      const name = f.name.toLowerCase();
      return name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.xlsx') || name.endsWith('.xls');
    });

    if (validFiles.length === 0) {
      setResults([{ file: 'Nenhum arquivo válido', success: false, message: 'Por favor, envie arquivos no formato CSV, TXT ou XLSX.' }]);
      setIsProcessing(false);
      return;
    }

    const newDatasets: IndicatorDataset[] = [];
    const newResults: UploadResult[] = [];

    for (const file of validFiles) {
      try {
        const dataset = await processFile(file);
        newDatasets.push(dataset);
        newResults.push({ file: file.name, success: true, size: file.size });
      } catch (err: any) {
        newResults.push({ file: file.name, success: false, message: err.message, size: file.size });
      }
    }

    setResults(newResults);
    setIsProcessing(false);
    
    if (newDatasets.length > 0) {
      setTimeout(() => {
        onDataUploaded(newDatasets);
      }, 2500);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Importar Relatórios SIAPS</h2>
        <p className="text-slate-500 mt-2">
          Faça o upload de um ou mais relatórios extraídos do SIAPS para atualizar os indicadores. O sistema identificará automaticamente qual indicador está sendo importado em cada arquivo.
        </p>
      </div>

      <div 
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
          isDragging 
            ? 'border-emerald-500 bg-emerald-50' 
            : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInput} 
          accept=".csv,.txt,.xlsx,.xls" 
          multiple
          className="hidden" 
        />
        
        <div className="flex flex-col items-center justify-center cursor-pointer">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-emerald-600">
            <Upload size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Clique ou arraste os arquivos aqui</h3>
          <p className="text-slate-500 mt-2 text-sm">Suporta múltiplos arquivos .XLSX, .CSV ou .TXT extraídos diretamente do SIAPS</p>
        </div>
      </div>

      {isProcessing && (
        <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-xl flex items-center gap-3">
          <RefreshCw className="animate-spin" size={20} />
          <p className="font-medium">Processando relatórios...</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Resultados da Importação:</h3>
          {results.map((r, idx) => (
            <div key={idx} className={`p-4 rounded-xl flex items-center gap-3 border ${r.success ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              {r.success ? <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" /> : <AlertCircle size={20} className="text-red-500 flex-shrink-0" />}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <FileText size={16} className={r.success ? "text-emerald-500" : "text-red-400"} />
                    {r.file}
                  </p>
                  {r.size && <span className="text-xs opacity-70">{(r.size / 1024).toFixed(1)} KB</span>}
                </div>
                {r.message && <p className="text-xs mt-1 opacity-80">{r.message}</p>}
              </div>
            </div>
          ))}
          
          {results.some(r => r.success) && !isProcessing && (
            <div className="mt-6 text-center animate-pulse">
              <p className="text-sm text-slate-600 font-medium">
                Redirecionando para o painel...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
