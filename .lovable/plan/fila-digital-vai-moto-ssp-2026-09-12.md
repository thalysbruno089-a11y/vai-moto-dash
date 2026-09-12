# Fila Digital Vai Moto SSP

## Objetivo
Criar dentro do sistema atual uma fila digital integrada aos motoboys já cadastrados. O número existente do motoboy será o código de check-in: por exemplo, Bruno cadastrado como `06` digitará `06` e entrará diretamente na fila, desde que esteja ativo e com pagamento em dia.

## Telas

### Entrada da Fila
- Criar uma página de entrada da Fila Digital com acesso à TV, check-in e controle.
- Usar a logo atual e a identidade visual roxa, azul-escura e branca.
- Manter o sistema atual como página principal; a Fila Digital será uma nova área no menu, sem substituir o Dashboard.

### TV / Display
- Tela cheia com logo, “Vai Moto SSP”, relógio e data.
- Destaque grande para o motoboy chamado, com código, nome e “Dirija-se ao balcão”.
- Lista dos próximos e contador da fila.
- Efeito visual temporário a cada nova chamada.
- Áudio opcional em português do Brasil, priorizando voz feminina, velocidade 0,9 e cancelando a fala anterior.
- Aviso discreto quando a atualização instantânea cair, mantendo atualização automática a cada 5 segundos.

### Celular / Check-in
- Tela pública otimizada para tablet e celular, com teclado numérico grande.
- O motoboy informa somente seu número já cadastrado, inclusive preservando zeros à esquerda como `06`.
- Permitir entrada apenas quando o cadastro estiver ativo e o pagamento estiver em dia.
- Impedir código inexistente, motoboy inativo, inadimplente ou já presente na fila.
- Mostrar chamado atual, quantidade e lista de espera.
- Áudio opcional; o aparelho anuncia quando o próprio motoboy for chamado.

### Administração
- Adicionar o controle da fila dentro do sistema autenticado, disponível para Carlos e Sofia.
- Abas: Fila, Corridas do dia, Corridas salvas e Cadastro.
- Ações: chamar próximo, finalizar atual, devolver à posição original e remover da fila.
- “Zerar e Salvar” cria um relatório com total do dia e quantidade de chamadas por motoboy, depois limpa os finalizados.
- A aba Cadastro reutiliza os motoboys atuais e permite cadastrar, editar, ativar/inativar e excluir conforme as permissões existentes.

## Dados e segurança
- Reutilizar `motoboys.id`, `number`, `name`, `phone`, `status` e `payment_status`; não criar um segundo cadastro.
- Criar tabelas próprias para entradas da fila, relatórios salvos e itens dos relatórios, todas vinculadas à empresa atual.
- Guardar a posição original da entrada para que “Voltar para fila” não envie o motoboy ao final.
- Impedir duas entradas abertas para o mesmo motoboy e manter somente um chamado atual por empresa.
- TV e check-in não exigirão login, mas não terão acesso direto ao cadastro completo dos motoboys.
- Check-in e leitura pública serão feitos por funções seguras que retornam somente código, nome e estado da fila; telefone, placa, valores e demais documentos não serão expostos.
- Alterações administrativas exigirão a sessão atual e validação de Carlos ou Sofia também no servidor, não apenas na tela.
- Toda nova tabela terá permissões explícitas e regras por empresa.

## Atualização entre aparelhos
- Ativar atualização instantânea para fila e motoboys.
- Encerrar corretamente as assinaturas ao sair das telas.
- Adicionar atualização de segurança a cada 5 segundos e ao retornar para a aba.
- Exibir o estado de conexão na TV e no celular.

## Integração visual e navegação
- Adicionar “Fila Digital” aos menus permitidos de Carlos e Sofia.
- Criar endereços para apresentação da fila, TV, check-in e administração sem conflitar com as páginas atuais.
- Usar os componentes e cores já existentes, com números monoespaçados e controles grandes.
- Ajustar título e descrição do site para também representar a Fila Digital, mantendo o sistema como ferramenta interna.
- Remover qualquer elemento de edição externo que apareça na interface final.

## Verificação
- Testar check-in com código válido, incluindo zero à esquerda, e todos os bloqueios.
- Testar a ordem completa: entrar, chamar, devolver à posição original, finalizar, remover, salvar e zerar.
- Abrir TV, celular e administração simultaneamente para validar a atualização instantânea e o modo de 5 segundos.
- Validar áudio, perda e retomada de conexão, telas grandes e celulares.
- Confirmar que usuários fora de Carlos e Sofia não controlam a fila e que páginas públicas não revelam dados privados.

## Detalhes técnicos
- O projeto atual usa React, Vite e React Router; a nova área seguirá essa estrutura existente em vez de trocar o aplicativo para TanStack Start.
- As mudanças de banco serão aplicadas por migração e incluirão publicação em tempo real.
- A página de diagnóstico ficará fora desta primeira entrega, pois foi indicada como opcional.
