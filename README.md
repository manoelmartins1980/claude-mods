# claude-mods

Mods do Claude Code que mostram faixas de informação acima do prompt:

| Mod | Mostra |
|---|---|
| `usage-band` | Consumo da janela de 5h e da semana, com o horário do próximo reset |
| `tokens-turno` | Tokens da última resposta (entrada, cache, saída) e o acumulado da sessão |
| `contexto-barra` | Barra da janela de contexto (tokens em uso, tamanho da janela e percentual) |

Os mods só leem o uso da própria sessão e desenham as faixas: não acessam arquivos, rede nem processos.

## Instalar

Num terminal do Claude Code:

```
/plugin install usage-band --marketplace manoelmartins1980/claude-mods
/plugin install tokens-turno --marketplace manoelmartins1980/claude-mods
/plugin install contexto-barra --marketplace manoelmartins1980/claude-mods
```

Num shell:

```
claude plugin marketplace add manoelmartins1980/claude-mods
claude plugin install usage-band@claude-mods --scope user
claude plugin install tokens-turno@claude-mods --scope user
claude plugin install contexto-barra@claude-mods --scope user
```

No app desktop, onde `/plugin` não roda: + ao lado da caixa do prompt, Plugins, Add marketplace com
`manoelmartins1980/claude-mods`, depois Add plugin.

## Sessões na nuvem

Os plugins precisam ser instalados no setup script de cada ambiente de nuvem. Uma versão que não
impede a sessão de abrir se algo falhar e grava um log para diagnóstico:

```bash
{
  if command -v claude >/dev/null 2>&1; then
    claude plugin marketplace add manoelmartins1980/claude-mods || true
    claude plugin install usage-band@claude-mods --scope user || true
    claude plugin install tokens-turno@claude-mods --scope user || true
    claude plugin install contexto-barra@claude-mods --scope user || true
    claude plugin list || true
  else
    echo "claude não está no PATH durante o setup"
  fi
} > /tmp/claude-mods-setup.log 2>&1 || true
```

## Fuso horário

`usage-band` mostra o reset no fuso definido na constante `TZ` de `usage-band/hooks/register.tsx`
(padrão `Europe/Lisbon`), para que o horário saia igual numa máquina local e numa máquina da nuvem em
UTC. Troque pelo seu fuso (nome IANA, por exemplo `America/Sao_Paulo`).

## Carregando a partir de uma pasta

Quem já carrega estes mods de uma pasta local (`--plugin-dir` ou `CLAUDE_CODE_PLUGIN_DIRS`) não deve
instalá-los também pelo marketplace na mesma máquina: cada faixa apareceria duas vezes.
