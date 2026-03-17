# Script PowerShell para testar WhatsApp
Write-Host "🔐 Fazendo login..."

try {
    $loginBody = @{
        email = "admin@crm.com"
        password = "admin123"
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/auth/login" -Body $loginBody -ContentType "application/json"
    $token = $login.access_token
    Write-Host "✅ Login OK - Token obtido"

    Write-Host "📤 Enviando mensagem para +5511992964792..."
    
    $sendBody = @{
        to = "+5511992964792"
        type = "text"
        text = "Teste backend funcionando!"
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/wa/send" -Headers @{ Authorization = "Bearer $token" } -Body $sendBody -ContentType "application/json"
    
    Write-Host "✅ Mensagem enviada com sucesso!"
    Write-Host "📱 ID da mensagem: $($result.messages[0].id)"
    Write-Host $result | ConvertTo-Json
    
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response | ConvertFrom-Json
        Write-Host "Detalhes: $errorContent"
    }
}

Write-Host "Pressione Enter para sair..."
Read-Host