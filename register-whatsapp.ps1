# Script para registrar numero WhatsApp
# Cole as informacoes abaixo:

$PHONE_NUMBER_ID = "953611337841896"
$ACCESS_TOKEN = "COLE_SEU_TOKEN_AQUI"
$PIN = "123456"  # Crie um PIN de 6 digitos (vai usar para recuperar conta)

$body = @{
    messaging_product = "whatsapp"
    pin = $PIN
} | ConvertTo-Json

Write-Host "Registrando numero..."
$response = Invoke-RestMethod -Uri "https://graph.facebook.com/v22.0/$PHONE_NUMBER_ID/register" -Method POST -Headers @{ Authorization = "Bearer $ACCESS_TOKEN"; "Content-Type" = "application/json" } -Body $body
Write-Host $response
