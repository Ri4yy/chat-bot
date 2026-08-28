async function run() {
  const formData = new FormData();
  formData.append('file', 'just a string');
  
  const res = await fetch('http://localhost:3000/api/parse-file', {
    method: 'POST',
    body: formData
  });

  const text = await res.text();
  console.log('Status:', res.status, 'Body:', text);
}
run();
