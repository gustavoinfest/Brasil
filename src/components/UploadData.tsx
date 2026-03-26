import React, { useState, useRef } from 'react';
import { Upload, UploadCloud, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
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
            return upperLine.includes('CNES') || upperLine.includes('INE') || upperLine.includes('NOME DA EQUIPE') || upperLine.includes('EQUIPE');
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
                         upperK.includes('PONTUACAO') ||
                         upperK.includes('RESULTADO') || 
                         upperK.includes('RAZÃO') ||
                         upperK.includes('RAZAO') ||
                         upperK.includes('TAXA') ||
                         upperK.includes('PROPORÇÃO') ||
                         upperK.includes('PROPORCAO') ||
                         upperK.includes('PERCENTUAL') ||
                         upperK.includes('SOMATÓRIO DA BOA PRÁTICA') ||
                         upperK === '%';
                });
                
                const pontuacaoRaw = pontuacaoKey ? row[pontuacaoKey] : '0';
                const pontuacao = parseNum(pontuacaoRaw);
                
                const numeradorKey = keys.find(k => {
                  const upperK = k.toUpperCase().trim();
                  return upperK.includes('NUMERADOR') && !upperK.includes('RAZÃO') && !upperK.includes('RAZAO');
                });
                const denominadorKey = keys.find(k => {
                  const upperK = k.toUpperCase().trim();
                  return upperK.includes('DENOMINADOR') && !upperK.includes('RAZÃO') && !upperK.includes('RAZAO');
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
    <div className="max-w-4xl mx-auto p-6 h-full overflow-y-auto pb-12">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Importar Relatórios SIAPS</h2>
        <p className="text-slate-500 mt-3 text-base max-w-2xl mx-auto">
          Faça o upload de um ou mais relatórios extraídos do SIAPS para atualizar os indicadores. O sistema identificará automaticamente qual indicador está sendo importado em cada arquivo.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
        
        <div 
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' 
              : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
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
          
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 mx-auto bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <UploadCloud size={40} className="text-indigo-500" />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-800 mb-2">Clique ou arraste os arquivos aqui</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm">
              Suporta múltiplos arquivos .XLSX, .CSV ou .TXT extraídos diretamente do SIAPS
            </p>
            
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 font-medium shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5">
              <FileText size={18} />
              Selecionar Arquivos
            </span>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center mb-8">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Processando relatórios...</p>
          <p className="text-slate-400 text-sm mt-1">Isso pode levar alguns segundos dependendo do tamanho dos arquivos.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-display font-bold text-slate-800 mb-4">Resultados da Importação:</h3>
          {results.map((r, idx) => (
            <div key={idx} className={`p-5 rounded-2xl flex items-start gap-4 border shadow-sm transition-all ${r.success ? 'bg-emerald-50/50 text-emerald-800 border-emerald-100' : 'bg-rose-50/50 text-rose-800 border-rose-100'}`}>
              {r.success ? <CheckCircle size={24} className="text-emerald-500 flex-shrink-0 mt-0.5" /> : <AlertCircle size={24} className="text-rose-500 flex-shrink-0 mt-0.5" />}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-base flex items-center gap-2">
                    <FileText size={18} className={r.success ? "text-emerald-500" : "text-rose-400"} />
                    {r.file}
                  </p>
                  {r.size && <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-white/60 text-slate-500">{(r.size / 1024).toFixed(1)} KB</span>}
                </div>
                {r.message && <p className="text-sm mt-2 text-slate-600 bg-white/50 p-3 rounded-xl border border-white/60">{r.message}</p>}
              </div>
            </div>
          ))}
          
          {results.some(r => r.success) && !isProcessing && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full font-medium text-sm animate-pulse">
                <RefreshCw size={16} className="animate-spin" />
                Redirecionando para o painel...
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 mt-10">
        <h3 className="font-display font-bold text-slate-800 mb-5 flex items-center gap-2 text-lg">
          <AlertCircle size={20} className="text-indigo-500" />
          Instruções para Importação
        </h3>
        <ul className="space-y-4 text-sm text-slate-600">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">1</div>
            <span className="leading-relaxed">Exporte os relatórios do SIAPS no formato CSV, TXT ou Excel.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">2</div>
            <span className="leading-relaxed">O sistema utiliza o nome do arquivo ou o cabeçalho para identificar o indicador correspondente.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">3</div>
            <span className="leading-relaxed">Certifique-se de que os arquivos contêm as colunas padrão do SIAPS (INE, Nome da Equipe, Numerador, Denominador, etc).</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">4</div>
            <span className="leading-relaxed">Para indicadores CVAT, o sistema buscará colunas como "TOTAL DE PESSOAS ACOMPANHADAS" e "PARÂMETRO POPULACIONAL".</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
