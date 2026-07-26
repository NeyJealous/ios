# Local exclusions for a new machine

`.git/info/exclude` is local Git metadata and is not transferred by clone.
If the same local artifacts exist on the new machine, add only:

```text
.codex/environments/
my-agent-app/
```

Do not add a broad `.codex/` rule: `.codex/agents/**` is tracked project
configuration. Do not add these machine-local rules to repository `.gitignore`.

On the source machine both rules were confirmed as coming from the local
exclude file. Neither ignored directory was read, committed or treated as IOS
project content.
