# TravelPlanner – Vodič za pokretanje i raspoređivanje (Deployment)

## 1. Preduslovi

- **Windows 10/11**
- **Visual Studio 2022** (sa instaliranim *Service Fabric development* radnim okruženjem)
- **Microsoft Service Fabric SDK & Local Cluster Manager**
- **SQL Server** (Express ili Developer) & **SQL Server Management Studio (SSMS)**
- **Node.js** (verzija 18 ili novija) & **npm**

---

## 2. Ključni NuGet paketi

- `Microsoft.ServiceFabric.Services.Remoting`
- `Microsoft.AspNetCore.Authentication.JwtBearer`
- `Microsoft.EntityFrameworkCore.SqlServer`
- `AutoMapper.Extensions.Microsoft.DependencyInjection`
- `Microsoft.AspNetCore.OpenApi`
- `Swashbuckle.AspNetCore`

---

## 3. Podešavanje bekenda (Backend Setup)

1. **Otvori rešenje (Solution)** Pokreni Visual Studio 2022 **kao administrator** (Run as Administrator) i otvori `.sln` fajl.

2. **Proveri stringove za povezivanje (Connection Strings)** Uredi `appsettings.json` fajlove u `UserService` i `ExpenseService` kako bi osigurao ispravne SQL Server konekcione stringove.

3. **Pokreni lokalni Service Fabric klaster** Otvori *Local Cluster Manager* i pokreni lokalni klaster sa **1 čvorom (1-Node)** ili **5 čvorova (5-Node)**.

4. **Postavi početni projekat (Startup Project)** Klikni desnim tasterom miša na glavni Service Fabric Application projekat → *Set as Startup Project*.

5. **Rasporedi i pokreni (Deploy & Run)** - Pritisni `F5` (za otklanjanje grešaka / Debug), ili  
   - Klikni desnim tasterom miša na projekat aplikacije → *Deploy*.

6. **Proveri servise** - UserService: http://localhost:5001  
   - TravelService: http://localhost:5002  
   - ExpenseService: http://localhost:5003

---

## 4. Podešavanje frontenda (Frontend Setup)

1. **Otvori terminal** Pozicioniraj se u `frontend` direktorijum.

2. **Instaliraj zavisnosti (Dependencies)** ```bash
   npm install

3. Pokreni frontend (Vite) ```bash
   npm run dev

   Aplikacija će biti dostupna na adresi http://localhost:5173.