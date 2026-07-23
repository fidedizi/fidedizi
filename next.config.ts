import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit lê arquivos de fontes (.afm) via caminho relativo a __dirname em
  // tempo de execução; deixando o pacote fora do bundle do Turbopack, o
  // Node.js resolve esse caminho corretamente via require nativo.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
