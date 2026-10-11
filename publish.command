#!/bin/bash
# 將「陳家紀錄」網站推送到 GitHub（需先在 GitHub 建立空的公開 repo：chen-family-records）
cd "$(dirname "$0")" || exit 1
REPO="https://github.com/yantong1213/chen-family-records.git"
rm -f publish.command.log
[ -d .git ] || git init -b main
git add -A
git -c user.name="yantong1213" -c user.email="yantong1213@users.noreply.github.com" commit -m "陳家紀錄 網站" || true
git remote remove origin 2>/dev/null; git remote add origin "$REPO"
git push -u origin main
echo "完成！到 GitHub repo 的 Settings → Pages，Source 選 main / (root)，網址會是 https://yantong1213.github.io/chen-family-records/"
read -p "按 Enter 關閉"
