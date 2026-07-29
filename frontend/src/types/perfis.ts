export interface PerfilAcessoResponse {
  id: number;
  nome: string;
  permissoes: string;
  createdAt: string;
  updatedAt: string;
  criadoPor: string | null;
  alteradoPor: string | null;
}

export interface PerfilAcessoRequest {
  nome: string;
  permissoes: string;
}

export interface UsuarioPerfilResponse {
  id: number;
  loginAd: string;
  perfilAcessoId: number;
  perfilNome: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioPerfilRequest {
  loginAd: string;
}
