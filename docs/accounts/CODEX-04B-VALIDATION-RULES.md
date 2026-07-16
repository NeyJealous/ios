# CODEX-04B Validation Rules

1. `Recommendations=true` при `Calculation=false` отклоняется.
2. Sync/Calculation нельзя включить для невалидного Account ID.
3. Browser не может передать raw Account ID; принимается только server-issued `accountRef`.
4. Отключение History не удаляет историю.
5. Выключение flags не удаляет production data.
6. Включение flags не восстанавливает архив.
7. Отключение всех Calculation-счетов требует critical confirmation.
8. Отключение действующего Calculation-счёта требует critical confirmation.
9. Ноль Display-счетов создаёт явное предупреждение.
10. Active sync блокирует apply.
11. Apply требует global script lock.
12. Revision conflict возвращает `ACCOUNT_SCOPE_REVISION_CONFLICT`.
13. Preview hash conflict возвращает `ACCOUNT_SCOPE_PREVIEW_HASH_CONFLICT`.
14. Unknown/missing flags консервативно считаются false.
15. Все связи и writes разрешаются только по Account ID на сервере.

`…020546` поддерживает display/history без calculation. `…531683` защищён critical confirmation при отключении Calculation. `…864109` не восстанавливает очищенные данные при включении flags.
