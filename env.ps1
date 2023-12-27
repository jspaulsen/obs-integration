# Read the .env file, split it into lines, and then split each line into key/value pairs.
# Then, for each pair, set an environment variable with the key and value.
Get-Content .env | Foreach-Object {
    $pair = $_.Split('=')
    Set-Item -Path "env:$($pair[0])" -Value $pair[1]
}