# Chef Talents

Chef Talents is a premium platform connecting private chefs with luxury conciergeries and UHNW (Ultra-High-Net-Worth) private clients. The application serves as a high-end marketplace, facilitating bookings for dinners, events, and seasonal residence staffing.

## Features

- **Dual User Flows:**
  - **Private Clients (B2C):** Seamless booking for dinners, villas, and yachts.
  - **Conciergeries (B2B):** Dedicated portal for agencies and family offices with priority access.
- **Chef Recruitment:** Comprehensive application form for chefs to join the "Select Roster".
- **Content Hub:** "Insights" blog sharing industry trends and guides.
- **Premium UI/UX:**
  - Elegant, serif-heavy typography (Playfair Display) for a luxury feel.
  - Fully responsive design using Tailwind CSS.
  - Smooth animations and transitions.

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS (via CDN)
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **Fonts:** Google Fonts (Inter & Playfair Display)

## Project Structure

```
.
├── components/       # Reusable UI components (Buttons, Cards, Layouts)
├── pages/           # Application route views (Home, Request, Chefs, etc.)
├── services/        # Mock backend services and server actions
├── types.ts         # TypeScript definitions
├── index.html       # Application entry point
├── index.tsx        # React root
└── metadata.json    # Application metadata
```

## Setup & Run Instructions

This project is designed to be lightweight. It currently uses ES Modules and `importmap` in `index.html` to load dependencies directly from CDNs (`esm.sh`), which allows it to run in modern browsers without a complex build step in specific environments.

However, for a standard local development experience, it is recommended to run this within a **Vite** environment.

### Prerequisites

- Node.js (v18+)
- npm

### Local Development (Recommended)

1.  **Initialize a new Vite project (if not already set up):**
    ```bash
    npm create vite@latest chef-talents -- --template react-ts
    cd chef-talents
    ```

2.  **Install required dependencies:**
    ```bash
    npm install react-router-dom lucide-react
    ```

3.  **Copy Source Files:**
    - Place the provided `.tsx` and `.ts` files into the `src/` folder.
    - Update `index.html` to standard Vite format if necessary (remove importmaps if bundling locally, or keep them if serving statically).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **View the app:**
    Open your browser to `http://localhost:5173`.

## License

© 2023 Chef Talents. All rights reserved.
