# Один GitHub на Linux, Windows и iPhone

Аккаунт: **testqcqaweb**. Канон на Linux: `~/Projects`.

Правило: правка → `git add` → `commit` → `git push`. На другой машине сначала `git pull`. Не копировать папки через облако и флешку.

## Репозитории

Публичные (не меняем видимость):

- https://github.com/testqcqaweb/soroka-prinesla — лендинг кассы
- https://github.com/testqcqaweb/Soroka_prinesla — портфолио
- https://github.com/testqcqaweb/travelvlog — заготовка

Приватные:

- `gagarin-evening`
- `omarchy-non-alco`
- `omarchy-pomodoro`

Не заливаем: чужой `kenhara.encyclopedic`, стоковые clock/background/workspaces, пустые `new_age` и `angelina+kirill+whiskey`.

## Windows

1. Установите [GitHub Desktop](https://desktop.github.com/) и войдите как **testqcqaweb**.
2. File → Clone repository → все репо выше в одну папку, например `Documents\Projects`.
3. Если на винде остались папки, которых нет на GitHub — пришлите список. Их тоже унесём в private.

Git: `git clone git@github.com:testqcqaweb/soroka-prinesla.git`

## iPhone

1. Приложение [Working Copy](https://workingcopy.app).
2. Settings → GitHub → войти как testqcqaweb (доступ к private).
3. Clone те же репо.
4. GitHub Mobile только смотрит. Cursor на телефоне Working Copy не заменяет.

## Linux после синка

Плагины Omarchy — симлинк из `~/Projects/omarchy-*` в `~/.config/omarchy/plugins/`.
SSH: ключ в `~/.ssh/id_ed25519`.
