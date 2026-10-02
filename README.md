First prototype (already connected to the Discovery and Routes APIs of Google Maps and working well)

<img width="1391" height="1018" alt="screenshot-2026-05-15_21-51-49" src="https://github.com/user-attachments/assets/839e2060-353f-4ac4-8a51-690628b79101" />

<img width="1395" height="1017" alt="screenshot-2026-05-15_21-51-22" src="https://github.com/user-attachments/assets/98071b00-1f29-41d2-a157-a15c25dfacfb" />

## Fare calculation

Bus cost uses Porto Alegre TRI card fares (`BUS_FARE_BRL`, default R$ 5,30) for a one-way trip:

- 1 bus: 1 fare
- 2 buses: 1.5 fares (TRI integration, 2nd bus at 50%)
- 3+ buses: full fare for every bus, with no integration discount. This is an intentional decision.
