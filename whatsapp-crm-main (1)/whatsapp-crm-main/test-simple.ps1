Write-Host "Testando WhatsApp..."

$loginBody = @{
    email = "admin@crm.com"
    password = "admin123"
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/auth/login" -Body $loginBody -ContentType "application/json"
Write-Host "Login OK"

$sendBody = @{
    to = "+5511992964792"
    type = "text"
    text = "Teste backend funcionando"
} | ConvertTo-Json

$result = Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/wa/send" -Headers @{ Authorization = "Bearer $($login.access_token)" } -Body $sendBody -ContentType "application/json"
Write-Host "Resultado:"
$result | ConvertTo-Json