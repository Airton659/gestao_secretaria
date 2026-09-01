export interface NotaProvaFiltro {
  codPerlet: string;
  ra:        string;
  codTurma:  string;
}

export interface NotaProvaResult {
  nomeAluno:        string;
  ra:               string;
  periodoLetivo:    string;
  turma:            string;
  codigoDisciplina: string;
  nomeDisciplina:   string;
  etapa:            string;
  tipoEtapa:        string;
  prova:            number;
  nota:             number | null;
  codconceito:      string | null;
  statusMatricula:  string;
}

export interface NotaEtapaFiltro {
  codPerlet:  string;
  ra:         string;
  codTurma:   string;
  tipoEtapa:  string; // 'N' | 'F' | ''
}

export interface NotaEtapaResult {
  nomeAluno:        string;
  ra:               string;
  periodoLetivo:    string;
  turma:            string;
  codigoDisciplina: string;
  nomeDisciplina:   string;
  etapa:            string;
  tipoEtapa:        string;
  notaEtapa:        string | null;
  mediaMinima:      number | null;
  statusMatricula:  string;
}
