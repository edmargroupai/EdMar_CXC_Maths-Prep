# EdMar CXC Maths Prep

CXC Mathematics prep platform for EdMar Group. Next.js on Vercel, data and auth on Supabase.

## Connected services

- GitHub: [edmargroupai/EdMar_CXC_Maths-Prep](https://github.com/edmargroupai/EdMar_CXC_Maths-Prep)
- Supabase project ref: `vrafxpxaeoxhpwtixggc`
- Vercel team: `edmargroupai`

## Local setup

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local` from the Supabase project settings, then:

```bash
npx supabase link --project-ref vrafxpxaeoxhpwtixggc
npm run dev
```

Required keys are listed in `.env.example`. Never commit `.env.local`.
