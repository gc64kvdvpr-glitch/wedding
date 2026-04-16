@echo off
echo =======================================
echo     청첩장 GitHub 자동 업로드 시작
echo =======================================
echo.

git add .
git commit -m "auto: update wedding announcement"
git push origin main

echo.
echo =======================================
echo     업로드가 성공적으로 완료되었습니다!
echo     (약 1~2분 뒤에 링크에 반영됩니다)
echo =======================================
pause
