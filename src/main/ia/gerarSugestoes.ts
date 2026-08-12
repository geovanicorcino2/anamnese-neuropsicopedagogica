import type { SugestaoIA } from "@core/db/types";
import { montarConteudoFicha } from "@core/services/anamneseContent";
import { interpretarRespostaSugestoes, montarPromptSugestoes } from "@core/services/promptSugestoes";
import { familiaresRepository, fichasRepository, perfilRepository, respostasRepository, sugestoesRepository } from "@main/db";
import { gerarTextoIa } from "@main/ia/clienteIa";

export async function gerarSugestoesParaFicha(idFicha: string): Promise<SugestaoIA> {
  const ficha = fichasRepository.getFicha(idFicha);
  if (!ficha) throw new Error(`Ficha "${idFicha}" não encontrada.`);

  const perfil = perfilRepository.getPerfil();
  if (!perfil) throw new Error("Perfil profissional ainda não foi configurado.");

  const entrada = sugestoesRepository.getSugestao(idFicha);
  if (!entrada?.Atividades?.trim()) {
    throw new Error("Preencha ao menos as Atividades da sessão antes de gerar a sugestão.");
  }

  const respostas = respostasRepository.listRespostas(idFicha);
  const familiares = familiaresRepository.listFamiliares(idFicha);
  const conteudo = montarConteudoFicha({ ficha, perfil, respostas, familiares });

  const prompt = montarPromptSugestoes(conteudo, {
    tempoSessao: entrada.Tempo_Sessao,
    atividades: entrada.Atividades,
    observacoes: entrada.Observacoes,
  });
  const textoIa = await gerarTextoIa(perfil, prompt);
  const { objetivo, materiais } = interpretarRespostaSugestoes(textoIa);

  return sugestoesRepository.salvarResultado(idFicha, { objetivoGerado: objetivo, materiaisGerado: materiais });
}
