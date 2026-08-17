export interface Producto {
    codigo: string;
    Nombre: string;
    Grupo?: string;
    Subgrupo?: string;
    PrecioBase: number;
    PrecioGrup?: number;
    CantidadGrup?: number;
    StockNum: number;
    CostoBase?: number;
    esPesable?: boolean;
    esFavorito?: boolean;
    [key: string]: any;
}

export interface CartItem {
    precio: number;
    cantidad: number;
    imagen?: string;
    subtotal: number;
    codigo: string;
    nombre?: string;
    categoria?: string;
    esCaja?: boolean;
}

export interface FiltrosState {
    categoriaActual: string;
    subcategoriaActual: string | null;
    modoVistaGlobal: string;
}

export interface PaginacionState {
    itemsPorPagina: number;
    paginaActual: number;
}

export interface AppState {
    inventario: Producto[];
    gruposInventario: any[];
    gruposCargados: string[];
    productosFiltrados: Producto[];
    carrito: Record<string, CartItem>;
    totalCarrito: number;
    totalCarritoBs?: number;
    favoritos: string[];
    tasaOficial: number;
    isTiendaAbierta: boolean;
    filtros: FiltrosState;
    paginacion: PaginacionState;
    debounceTimer: any;
    codigosRecomendados?: string[];
    checkoutStep?: number;
}

declare global {
    var appState: AppState;
    function safeGetItem(key: string): string | null;
    function safeSetItem(key: string, value: string): void;
    function safeRemoveItem(key: string): void;
    function mostrarToastError(t: string, m: string): void;
    function mostrarToastExito(t: string, m: string): void;
    function actualizarCarrito(): void;
    function tieneStockSuficiente(n: string, c: boolean): boolean;
    function compararIDs(a: any, b: any): boolean;

    interface Window {
        appState: AppState;
        safeGetItem: (key: string) => string | null;
        safeSetItem: (key: string, value: string) => void;
        safeRemoveItem: (key: string) => void;
        mostrarToastError: (t: string, m: string) => void;
        mostrarToastExito: (t: string, m: string) => void;
        actualizarCarrito: () => void;
        tieneStockSuficiente: (n: string, c: boolean) => boolean;
        compararIDs: (a: any, b: any) => boolean;
        isTiendaAbierta?: boolean;
    }
}
