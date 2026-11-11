# claude-mods

Mods do Claude Code com as faixas acima do prompt:

| Mod | Mostra |
|---|---|
| `usage-band` | Consumo da janela de 5h e da semana, com horário de reset em Lisboa |
| `tokens-turno` | Tokens da última resposta (entrada, cache, saída) e o acumulado da sessão |
| `contexto-barra` | Barra da janela de contexto (tokens em uso, janela e percentual) |

## Instalar

Repositório público: instala sem credencial do GitHub, inclusive no setup script das sessões na nuvem.

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

No setup script de cada ambiente de nuvem, rodar as linhas "Num shell" acima.

## PC do Manoel

No PC os mods carregam de `~/.claude/mods/` pela variável `CLAUDE_CODE_PLUGIN_DIRS` do
`~/.claude/settings.json`. Não instalar também por aqui, senão cada faixa aparece duas vezes.
Uma mudança feita num lugar precisa ser copiada para o outro.
