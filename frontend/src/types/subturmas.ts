export interface SubturmaFiltro {
  codPerlet: string;
  codTurma:  string;
  maxAlunos: number;
}

export interface SubturmaResult {
  codColigada:                 number;
  idPerlet:                    number;
  codTurmaGerencial:           string;
  nomeTurmaGerencial:          string;
  codTurmaGerenciada:          string;
  idTurmaDiscGerencial:        number;
  idTurmaDiscGerenciada:       number;
  codSubturma:                 string;
  maxAlunosGer:                number | null;
  maxAlunosGerd:               number;
  qtdAlunosNestaSubturma:      number;
  totalAlunosMesmoCodSubturma: number;
}
