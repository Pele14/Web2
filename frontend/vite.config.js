import { defineConfig } from 'vite'
import react from '@vitejs/react-vite'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,     
        strictPort: true 


    }
})