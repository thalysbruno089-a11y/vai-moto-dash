# Áudio da fila no aparelho de entrada

## Objetivo
O celular ou tablet usado para digitar códigos, conectado à caixa de som, anunciará cada novo motoboy chamado, como a TV: “Da vez, [nome]”. Não ficará limitado ao motoboy que digitou o código naquele aparelho.

## Mudanças
- Ajustar a tela de entrada para anunciar toda nova chamada recebida, sem repetir a mesma chamada nas atualizações automáticas nem falar uma chamada antiga ao abrir a página.
- Criar uma ativação clara do som por toque na tela para atender às restrições de áudio dos navegadores de celular e tablet. Manter controle para ligar/desligar o áudio e indicar quando não estiver ativado.
- Priorizar uma voz feminina em português do Brasil disponível no aparelho e aguardar o carregamento da lista de vozes quando necessário. Se não houver voz feminina instalada, usar a melhor voz em português disponível e não prometer uma voz que o aparelho não possui.
- Preservar o anúncio da TV e o restante da fila sem mudanças de regras.

## Verificação
- Abrir a tela de código no celular/tablet, ativar o áudio e chamar diferentes motoboys pelo controle da fila: conferir que todos são anunciados uma vez, com o nome correto.
- Conferir silêncio quando desligado, ausência de repetição ao atualizar a lista e comportamento ao reabrir a página; verificar a voz selecionada onde o aparelho permitir.

## Detalhes técnicos
- Reutilizar a leitura pública e a função de síntese de fala existentes; remover da tela de entrada o filtro que só anuncia o código registrado no próprio aparelho.
- A reprodução automática depende de um toque do usuário, e a disponibilidade de voz feminina depende das vozes instaladas pelo sistema/navegador.
