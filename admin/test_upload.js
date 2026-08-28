const fs = require('fs');
const xlsx = require('xlsx');

async function run() {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([['Hello', 'World']]);
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync('test.xlsx', buf);

  const formData = new FormData();
  formData.append('file', new Blob([buf]), 'test.xlsx');

  const res = await fetch('http://localhost:3000/api/parse-file', {
    method: 'POST',
    body: formData
  });

  const text = await res.text();
  console.log('Status:', res.status, 'Body:', text);
}
run();
