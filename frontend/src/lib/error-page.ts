export function renderErrorPage(message = "서버 오류가 발생했습니다."): string {
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>오류 발생</title>
    <style>
      body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
      .box { text-align: center; padding: 2rem; }
      h1 { font-size: 1.5rem; color: #1e293b; }
      p { color: #64748b; margin-top: 0.5rem; }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>오류가 발생했습니다</h1>
      <p>${message}</p>
    </div>
  </body>
</html>`;
}
