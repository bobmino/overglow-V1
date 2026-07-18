# 09 — Mail SMTP & DNS (SPF/DKIM/DMARC)

## App (Wave 1 — code prêt)

Variables déjà attendues par le backend (`EMAIL_*`) :

```
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=Overglow Trip <noreply@overglow.online>
```

Templates existants : reset password, booking confirmations.  
Soft-launch : si SMTP absent, pages Contact peuvent rester en `mailto:` — documenter clairement.

Test local : déclencher reset password + email booking (logs SMTP).

## DNS (Wave 3 — ops)

Sur zone `overglow.online` (chez le registrar) :

| Record | But |
|--------|-----|
| SPF TXT | `v=spf1 include:… ~all` (selon provider SMTP) |
| DKIM | Clés fournies par Postfix / Mailgun / Resend |
| DMARC | `v=DMARC1; p=none; rua=mailto:dmarc@overglow.online` puis durcir |

Providers possibles : Postfix self-host, Mailgun, Resend, SMTP OVH/Infomaniak.

## Checklist go-live mail

- [ ] SMTP prod dans `.env`  
- [ ] SPF/DKIM/DMARC publiés  
- [ ] Test inbox Gmail + Outlook (pas spam)  
- [ ] Adresse support `@overglow.online` dans CGU / Contact  
