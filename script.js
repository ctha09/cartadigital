const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co"; 
const SUPABASE_KEY = "TU_NUEVA_PUBLISHABLE_KEY_AQUI"; // Usá la de arriba en tu foto
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEFONO_WHATSAPP = "543751246552";
let carrito = [];
let esAdmin = false;

// CARGAR EL MENÚ
async function cargarMenu() {
    const { data: productos, error } = await _supabase
        .from('productos') // Tabla en minúsculas
        .select('*')
        .order('nombre', { ascending: true });

    if (error) return console.error(error);

    const categorias = ['entradas', 'comidas', 'bebidas'];
    categorias.forEach(cat => {
        const divLista = document.querySelector(`#${cat} .lista`);
        if (!divLista) return;
        divLista.innerHTML = "";
        
        const filtrados = productos.filter(p => p.categoria === cat);
        filtrados.forEach(p => {
            let adminBtns = esAdmin ? `<button onclick="eliminarProducto(${p.id})">🗑</button>` : "";
            divLista.innerHTML += `
                <div class="menu-item">
                    <img src="${p.imagen}" class="item-img">
                    <div class="info">
                        <h3>${p.nombre}</h3>
                        <p>$${p.precio}</p>
                        ${adminBtns}
                        <button onclick="agregarCarrito('${p.nombre}', ${p.precio})">AGREGAR</button>
                    </div>
                </div>`;
        });
    });
}

// GUARDAR CON GALERÍA
async function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const foto = document.getElementById('add-imagen').files[0];

    if(!nombre || !precio || !foto) return alert("Faltan datos");

    // 1. Subir al Storage
    const fileName = `${Date.now()}_${foto.name}`;
    const { data: upData, error: upErr } = await _supabase.storage.from('imagenes-menu').upload(fileName, foto);
    if(upErr) return alert("Error foto: " + upErr.message);

    // 2. Obtener URL y guardar en tabla
    const { data: url } = _supabase.storage.from('imagenes-menu').getPublicUrl(fileName);
    await _supabase.from('productos').insert([{ nombre, precio: parseInt(precio), categoria, imagen: url.publicUrl }]);

    location.reload();
}

function toggleAdmin() {
    const pin = prompt("PIN:");
    if(pin === "031223") { // Tu PIN guardado
        esAdmin = true;
        document.getElementById('form-nuevo-producto').style.display = 'block';
        cargarMenu();
    }
}

document.addEventListener('DOMContentLoaded', cargarMenu);
