export interface TeamData {
  id: string;
  cnes: string;
  estabelecimento: string;
  tipoEstabelecimento: string;
  ine: string;
  nomeEquipe: string;
  siglaEquipe: string;
  pontuacao: number;
  numerador?: number;
  denominador?: number;
  status: 'success' | 'warning' | 'danger';
  raw: any;
}

export interface IndicatorDataset {
  id: string;
  name: string;
  data: TeamData[];
  lastUpdated: string;
}

export const PREDEFINED_INDICATORS = [
  { id: 'cvat', name: 'CVAT', group: 'Geral', match: 'CVAT' },
  { id: 'mais_acesso', name: 'Mais Acesso', group: 'eSF/eAP', match: 'Mais Acesso à Atenção Primária à Saúde' },
  { id: 'desenvolvimento_infantil', name: 'Desenvolvimento Infantil', group: 'eSF/eAP', match: 'Desenvolvimento Infantil' },
  { id: 'gestacao_puerperio', name: 'Gestação e Puerpério', group: 'eSF/eAP', match: 'Cuidado na Gestação e Puerpério' },
  { id: 'diabetes', name: 'Diabetes', group: 'eSF/eAP', match: 'Cuidado da pessoa com Diabetes' },
  { id: 'hipertensao', name: 'Hipertensão', group: 'eSF/eAP', match: 'Cuidado da pessoa com Hipertensão' },
  { id: 'pessoa_idosa', name: 'Pessoa Idosa', group: 'eSF/eAP', match: 'Cuidado integral da Pessoa Idosa' },
  { id: 'prevencao_cancer', name: 'Prevenção do Câncer', group: 'eSF/eAP', match: 'Prevenção do Câncer' },
  { id: 'esb_1_consulta', name: '1ª Consulta', group: 'eSB', match: '1ª Consulta' },
  { id: 'esb_tratamento_concluido', name: 'Tratamento Odontológico Concluído', group: 'eSB', match: 'Concluido' },
  { id: 'esb_exodontia', name: 'Taxa de Exodontia', group: 'eSB', match: 'Exodontia' },
  { id: 'esb_escovacao', name: 'Escovação Supervisionada', group: 'eSB', match: 'Escovação Supervisionada' },
  { id: 'esb_preventivos', name: 'Procedimentos Preventivos', group: 'eSB', match: 'Procedimentos Odontologicos Preventivos' },
  { id: 'esb_atraumatico', name: 'Tratamento Atraumático', group: 'eSB', match: 'Tratamento Restaurador Atraumático' },
];

export interface AppState {
  datasets: Record<string, IndicatorDataset>;
  lastUpdated: string | null;
}
