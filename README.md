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

Plugins instalados com uma sessão já aberta só carregam na próxima sessão ou depois de
`/reload-plugins`, digitado na caixa do prompt (também no app desktop).

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

### As faixas não aparecem na sessão de nuvem

O processo do Claude Code de uma sessão de nuvem pode já estar rodando (pré-aquecido) quando o setup
script termina. Nesse caso, os mods ficam instalados e `claude plugin list` os mostra como `enabled`,
mas eles não carregam, e nenhuma faixa aparece. **Digite `/reload-plugins` na caixa do prompt** no
início da sessão: a saída mostra `Reloaded:` com a contagem de plugins, e as faixas aparecem.

- O comando só funciona digitado por você: o Claude não consegue rodá-lo.
- Para confirmar que um mod carregou, veja se existe a pasta `.claude-plugin/types/` dentro dele
  (`~/.claude/plugins/cache/claude-mods/<mod>/<versão>/`); o Claude Code a cria ao carregar o mod.
- Declarar o marketplace e os plugins no `.claude/settings.json` do repositório
  (`extraKnownMarketplaces` + `enabledPlugins`) não resolve: sessões de nuvem não instalam plugins
  declarados assim.
- Se os mods já foram carregados de outro jeito na sessão (por exemplo, de uma pasta), não rode
  `/reload-plugins`: cada faixa apareceria duas vezes.

## Fuso horário

`usage-band` mostra o reset no fuso definido na constante `TZ` de `usage-band/hooks/register.tsx`
(padrão `Europe/Lisbon`), para que o horário saia igual numa máquina local e numa máquina da nuvem em
UTC. Troque pelo seu fuso (nome IANA, por exemplo `America/Sao_Paulo`).

## Carregando a partir de uma pasta

Quem já carrega estes mods de uma pasta local (`--plugin-dir` ou `CLAUDE_CODE_PLUGIN_DIRS`) não deve
instalá-los também pelo marketplace na mesma máquina: cada faixa apareceria duas vezes.
