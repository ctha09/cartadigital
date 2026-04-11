// CONFIGURACIÓN DE CONEXIÓN A SUPABASE
const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aHRyYnp2aW9kY2xpb3F0bWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQ2NTcsImV4cCI6MjA5MTQyMDY1N30.pROjzOh1pN52aDWDJCVWZ4TC6Nqu-cRidk_vAqckAxA"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let carrito = [];
let isAdmin = false;

// 1. GESTIÓN DE ACCESO (MANTENIMIENTO)
function toggleAdmin() {
    const pass = prompt("Clave de mantenimiento:");
    // Clave configurada según tu solicitud: 031223
    if(pass && pass.trim() === "031223") { 
        isAdmin = true;
        document.getElementById('form-admin').style.display = 'block';
        cargarMenu();
        alert("Acceso concedido");
    } else {
        alert("Clave incorrecta.");
    }
}

function cerrarAdmin() {
    isAdmin = false;
    document.getElementById('form-admin').style.display = 'none';
    cargarMenu();
}

// 2. CARGAR MENÚ DESDE SUPABASE
async function cargarMenu() {
    const { data: productos, error } = await _supabase
        .from('productos') 
        .select('*')
        .order('nombre', { ascending: true });

    if (error) {
        console.error("Error al cargar menú:", error);
        return;
    }

    const menuDinamico = document.getElementById('menu-dinamico');
    menuDinamico.innerHTML = "";
    
    const categorias = ["entradas", "comidas", "sin-alcohol", "con-alcohol"];
    
    categorias.forEach(cat => {
        const items = productos.filter(p => p.categoria === cat);
        if (items.length > 0) {
            let html = `<section id="${cat}"><div class="category-title">${cat.replace("-", " ").toUpperCase()}</div><div class="lista-items">`;
            items.forEach(p => {
                // Se usa la columna imagen_url o un placeholder si está vacía
                const imgUrl = p.imagen_url || 'https://via.placeholder.com/150/111/c5a059?text=AIRES';
                html += `
                    <div class="menu-item">
                        <img src="${imgUrl}" class="item-img" onerror="this.src='https://via.placeholder.com/150/111/c5a059?text=AIRES'">
                        <div class="item-content">
                            <h3>${p.nombre}</h3>
                            <p class="price">€${p.precio}</p>
                            <div class="btn-container">
                                ${isAdmin ? `<button class="btn-borrar" onclick="eliminarProducto('${p.id}')">BORRAR</button>` : ''}
                                <button class="btn-order" onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">AGREGAR</button>
                            </div>
                        </div>
                    </div>`;
            });
            html += `</div></section>`;
            menuDinamico.innerHTML += html;
        }
    });
}

// 3. SUBIR NUEVO PRODUCTO (ADMIN)
async function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const imagenFile = document.getElementById('add-imagen').files[0];

    if (!nombre || !precio || !imagenFile) {
        alert("Por favor, completa nombre, precio y selecciona una imagen.");
        return;
    }

    try {
        const bucketName = 'imagenes'; 
        const fileName = `${Date.now()}_${imagenFile.name.replace(/\s/g, '_')}`;

        // Subida de imagen al Storage
        const { data: imgData, error: imgError } = await _supabase.storage
            .from(bucketName)
            .upload(fileName, imagenFile);

        if (imgError) throw imgError;

        // Obtener URL Pública de la imagen subida
        const { data: publicUrlData } = _supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        const imagen_url = publicUrlData.publicUrl;

        // Insertar registro en la tabla 'productos'
        const { error: insertError } = await _supabase
            .from('productos')
            .insert([{ 
                nombre: nombre, 
                precio: parseFloat(precio), 
                categoria: categoria, 
                imagen_url: imagen_url 
            }]);

        if (insertError) throw insertError;

        alert("¡Producto subido con éxito!");
        // Limpiar campos y refrescar
        document.getElementById('add-nombre').value = "";
        document.getElementById('add-precio').value = "";
        cargarMenu();

    } catch (err) {
        console.error("Error al subir:", err);
        alert("Error: " + err.message);
    }
}

// 4. GESTIÓN DEL CARRITO
function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre, precio });
    actualizarCarritoUI();
}

// Permite eliminar productos individualmente del carrito
function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const lista = document.getElementById('lista-carrito');
    const totalElem = document.getElementById('total-precio');
    lista.innerHTML = "";
    let total = 0;

    carrito.forEach((item, index) => {
        total += item.precio;
        lista.innerHTML += `
            <div class="item-carrito" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-size: 0.95rem; font-weight: 600;">${item.nombre}</span>
                    <span style="color: var(--gold); font-size: 0.85rem;">€${item.precio}</span>
                </div>
                <button onclick="quitarDelCarrito(${index})" style="background:none; border:1px solid #ff4444; color:#ff4444; border-radius:4px; padding:4px 10px; font-size:0.65rem; cursor:pointer; text-transform:uppercase;">Quitar</button>
            </div>`;
    });
    totalElem.innerText = `€${total}`;
}

// 5. ELIMINAR DEL MENÚ (ADMIN)
async function eliminarProducto(id) {
    if(!confirm("¿Eliminar este plato del menú permanentemente?")) return;
    const { error } = await _supabase.from('productos').delete().eq('id', id);
    if (error) alert("Error al borrar de la base de datos.");
    else cargarMenu();
}

// 6. ENVÍO POR WHATSAPP
function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if(!mesa || carrito.length === 0) return alert("Ingresa n° de mesa y productos");
    
    let mensaje = `*PEDIDO MESA ${mesa} - AIRES ESTORIL*\n\n`;
    carrito.forEach(i => mensaje += `• ${i.nombre} - €${i.precio}\n`);
    mensaje += `\n*TOTAL: ${document.getElementById('total-precio').innerText}*`;
    
    // Reemplaza con tu número de WhatsApp real (ejemplo: 34600000000)
    window.open(`https://wa.me/34000000000?text=${encodeURIComponent(mensaje)}`);
}

// CARGA INICIAL
window.onload = cargarMenu;
