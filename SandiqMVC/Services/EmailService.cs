using MailKit.Net.Smtp;
using MimeKit;

namespace SandiqMVC.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetCode)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_configuration["Smtp:FromName"], _configuration["Smtp:Username"]));
        message.To.Add(new MailboxAddress("", toEmail));
        message.Subject = "Sandıq - Şifrə sıfırlama";

        message.Body = new TextPart("plain")
        {
            Text = $"Salam,\n\nŞifrənizi sıfırlamaq üçün bu kodu istifadə edin: {resetCode}\n\nBu kod 15 dəqiqə etibarlıdır.\n\nƏgər bu sorğunu siz göndərməmisinizsə, bu mesajı nəzərə almayın.\n\nSandıq komandası"
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(_configuration["Smtp:Host"], int.Parse(_configuration["Smtp:Port"]!), MailKit.Security.SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_configuration["Smtp:Username"], _configuration["Smtp:Password"]);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
