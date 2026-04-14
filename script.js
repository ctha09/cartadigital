// 1. CONFIGURACIÓN DE CONEXIÓN A SUPABASE
const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aHRyYnp2aW9kY2xpb3F0bWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQ2NTcsImV4cCI6MjA5MTQyMDY1N30.pROjzOh1pN52aDWDJCVWZ4TC6Nqu-cRidk_vAqckAxA"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. SISTEMA DE TRADUCCIÓN COMPLETO
const traducciones = {
    es: {
        ver_menu: "VER MENÚ", mantenimiento: "MANTENIMIENTO", experiencia: "EXPERIENCIA ARTESANAL",
        pedido: "Tu Pedido", total: "TOTAL:", mesa: "N° DE MESA:", finalizar: "FINALIZAR PEDIDO",
        subir: "SUBIR AL MENÚ", nuevo: "Nuevo Producto", foto: "📸 Seleccionar Foto",
        entradas: "ENTRADAS", "platos-de-autor": "PLATOS DE AUTOR", comidas: "COMIDAS",
        acompañamientos: "ACOMPAÑAMIENTOS", postres: "POSTRES", "sin-alcohol": "SIN ALCOHOL",
        "con-alcohol": "CON ALCOHOL", agregar: "AGREGAR", borrar: "BORRAR", editar: "EDITAR",
        quitar: "Quitar", info: "INFO", ingredientes: "Conoce los ingredientes",
        alerta_datos: "Ingresa n° de mesa y productos", alerta_admin: "Por favor, completa nombre, precio y selecciona una imagen."
    },
    en: {
        ver_menu: "VIEW MENU", mantenimiento: "MAINTENANCE", experiencia: "ARTISAN EXPERIENCE",
        pedido: "Your Order", total: "TOTAL:", mesa: "TABLE N°:", finalizar: "PLACE ORDER",
        subir: "UPLOAD TO MENU", nuevo: "New Product", foto: "📸 Select Photo",
        entradas: "STARTERS", "platos-de-autor": "SIGNATURE DISHES", comidas: "MAINS",
        acompañamientos: "SIDES", postres: "DESSERTS", "sin-alcohol": "SOFT DRINKS",
        "con-alcohol": "ALCOHOLIC DRINKS", agregar: "ADD", borrar: "DELETE", editar: "EDIT",
        quitar: "Remove", info: "INFO", ingredientes: "Discover the ingredients",
        alerta_datos: "Enter table number and products", alerta_admin: "Please fill in name, price, and select an image."
    },
    pt: {
        ver_menu: "VER CARDÁPIO", mantenimiento: "MANUTENÇÃO", experiencia: "EXPERIÊNCIA ARTESANAL",
        pedido: "Seu Pedido", total: "TOTAL:", mesa: "N° DA MESA:", finalizar: "FINALIZAR PEDIDO",
        subir: "ADICIONAR AO CARDÁPIO", nuevo: "Novo Produto", foto: "📸 Selecionar Foto",
        entradas: "ENTRADAS", "platos-de-autor": "PRATOS DE AUTOR", comidas: "REFEIÇÕES",
        acompañamientos: "ACOMPANHAMENTOS", postres: "SOBREMESAS", "sin-alcohol": "SEM ÁLCOOL",
        "con-alcohol": "COM ÁLCOOL", agregar: "ADICIONAR", borrar: "EXCLUIR", editar: "EDITAR",
        quitar: "Remover", info: "INFO", ingredientes: "Conheça os ingredientes",
        alerta_datos: "Insira o n° da mesa e productos", alerta_admin: "Por favor, preencha nome, preço e selecione uma imagem."
    },
    fr: {
        ver_menu: "VOIR LE MENU", mantenimiento: "MAINTENANCE", experiencia: "EXPÉRIENCE ARTISANALE",
        pedido: "Votre Commande", total: "TOTAL:", mesa: "N° DE TABLE:", finalizar: "PASSER COMMANDE",
        subir: "AJOUTER AU MENU", nuevo: "Nouveau Produit", foto: "📸 Choisir une Photo",
        entradas: "ENTRÉES", "platos-de-autor": "PLATS SIGNATURE", comidas: "PLATS",
        acompañamientos: "ACCOMPAGNEMENTS", postres: "DESSERTS", "sin-alcohol": "SANS ALCOOL",
        "con-alcohol": "AVEC ALCOOL", agregar: "AJOUTER", borrar: "SUPPRIMER", editar: "MODIFIER",
        quitar: "Enlever", info: "INFO", ingredientes: "Découvrez les ingrédients",
        alerta_datos: "Entrez le n° de table et les produits", alerta_admin: "Veuillez remplir le nom, le prix et choisir une image."
    }
};

let idiomaActual = "es";
let carrito = [];
let isAdmin = false;

// 3. FUNCIONES DE INTERFAZ
function entrarAlMenu() {
    const screen = document.getElementById('welcome-screen');
    if (screen) screen.classList.add('hidden-welcome');
}

function abrirModal(nombre, desc) {
    const t = traducciones[idiomaActual];
    document.getElementById('modal-titulo').innerText = nombre;
    document.getElementById('modal-desc').innerText = desc || "...";
    document.getElementById('info-modal').style.display = 'block';
}

function cerrarModal() {
    document.getElementById('info-modal').style.display = 'none';
}

function cambiarIdioma(lang) {
    idiomaActual = lang;
    const t = traducciones[lang];
    
    const btnPortada = document.querySelector('.btn-ver-menu');
    const subPortada = document.querySelector('.welcome-subtitle');
    if(btnPortada) btnPortada.innerText = t.ver_menu;
    if(subPortada) subPortada.innerText = t.experiencia;

    document.getElementById('btn-admin-view').innerText = t.mantenimiento;
    document.querySelector('.subtitle').innerText = t.experiencia;
    document.querySelector('#carrito .category-title').innerText = t.pedido;
    document.querySelector('.cart-total span:first-child').innerText = t.total;
    document.querySelector('#carrito .btn-finalizar').innerText = t.finalizar;

    cargarMenu();
    actualizarCarritoUI();
}

// 4. GESTIÓN DE ACCESO
function toggleAdmin() {
    const pass = prompt("Clave de mantenimiento:");
    if(pass && pass.trim() === "031223") { 
        isAdmin = true;
        const panel = document.getElementById('form-admin');
        panel.style.display = 'block';
        cargarMenu(); 
        setTimeout(() => { panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 150);
    } else { alert("Clave incorrecta."); }
}

function cerrarAdmin() {
    isAdmin = false;
    document.getElementById('form-admin').style.display = 'none';
    cargarMenu();
}

// 5. CARGAR MENÚ
async function cargarMenu() {
    const { data: productos, error } = await _supabase.from('productos').select('*').order('nombre', { ascending: true });
    if (error) return console.error(error);

    const t = traducciones[idiomaActual];
    const menuDinamico = document.getElementById('menu-dinamico');
    menuDinamico.innerHTML = "";
    
    const categorias = ["entradas", "platos-de-autor", "comidas", "acompañamientos", "postres", "sin-alcohol", "con-alcohol"];
    
    categorias.forEach(cat => {
        const items = productos.filter(p => p.categoria === cat);
        if (items.length > 0) {
            const nombreCat = t[cat] || traducciones['es'][cat]; 
            let html = `<section id="${cat}"><div class="category-title">${nombreCat}</div><div class="lista-items">`;
            items.forEach(p => {
                const imgUrl = p.imagen_url || 'https://via.placeholder.com/150/111/c5a059?text=AIRES';
                const descSegura = p.descripcion ? p.descripcion.replace(/'/g, "&apos;") : "";
                const nombreSeguro = p.nombre.replace(/'/g, "&apos;");

                html += `
                    <div class="menu-item">
                        <img src="${imgUrl}" class="item-img" onerror="this.src='https://via.placeholder.com/150/111/c5a059?text=AIRES'">
                        <div class="item-content">
                            <h3>${p.nombre}</h3>
                            <p class="price">€${parseFloat(p.precio).toFixed(2)}</p>
                            <div class="btn-container">
                                ${isAdmin ? `
                                    <button class="btn-borrar" onclick="eliminarProducto('${p.id}')">${t.borrar}</button>
                                    <button class="btn-editar" onclick="editarProducto('${p.id}', '${nombreSeguro}', ${p.precio}, '${descSegura}')">${t.editar}</button>
                                ` : ''}
                                <button class="btn-ver-desc" onclick="abrirModal('${nombreSeguro}', '${descSegura}')">${t.info}</button>
                                <button class="btn-order" onclick="agregarAlCarrito('${nombreSeguro}', ${p.precio})">${t.agregar}</button>
                            </div>
                        </div>
                    </div>`;
            });
            html += `</div></section>`;
            menuDinamico.innerHTML += html;
        }
    });
}

// 6. ACCIONES ADMIN
async function editarProducto(id, nombreActual, precioActual, descActual) {
    const nuevoNombre = prompt(`Nombre del producto:`, nombreActual);
    if (nuevoNombre === null || nuevoNombre.trim() === "") return;

    const nuevoPrecio = prompt(`Precio de "${nuevoNombre}":`, precioActual);
    if (nuevoPrecio === null || nuevoPrecio.trim() === "") return;

    const nuevaDesc = prompt(`Descripción de "${nuevoNombre}":`, descActual);
    if (nuevaDesc === null) return;

    const { error } = await _supabase.from('productos').update({ 
        nombre: nuevoNombre, 
        precio: parseFloat(nuevoPrecio), 
        descripcion: nuevaDesc 
    }).eq('id', id);
    
    if (error) alert("Error al actualizar");
    else { alert("¡Actualizado!"); cargarMenu(); }
}

async function guardarNuevoProducto() {
    const t = traducciones[idiomaActual];
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value; 
    const categoria = document.getElementById('add-categoria').value;
    const descripcion = document.getElementById('add-descripcion').value;
    const imagenFile = document.getElementById('add-imagen').files[0];

    if (!nombre || !precio || !imagenFile) return alert(t.alerta_admin);

    try {
        const fileName = `${Date.now()}_${imagenFile.name.replace(/\s/g, '_')}`;
        await _supabase.storage.from('imagenes').upload(fileName, imagenFile);
        const { data: publicUrlData } = _supabase.storage.from('imagenes').getPublicUrl(fileName);

        await _supabase.from('productos').insert([{ 
            nombre, precio: parseFloat(precio), categoria, descripcion, imagen_url: publicUrlData.publicUrl 
        }]);

        alert("Guardado con éxito");
        document.getElementById('add-nombre').value = "";
        document.getElementById('add-precio').value = "";
        document.getElementById('add-descripcion').value = "";
        cargarMenu(); 
    } catch (err) { alert("Error al subir el producto"); }
}

async function eliminarProducto(id) {
    if(confirm("¿Seguro que deseas eliminar este producto?")) {
        await _supabase.from('productos').delete().eq('id', id);
        cargarMenu();
    }
}

// 7. CARRITO Y WHATSAPP (CORREGIDO)
function agregarAlCarrito(nombre, precio) {
    const item = carrito.find(i => i.nombre === nombre);
    if (item) item.cantidad += 1;
    else carrito.push({ nombre, precio: parseFloat(precio), cantidad: 1 });
    actualizarCarritoUI();
}

function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const t = traducciones[idiomaActual];
    const lista = document.getElementById('lista-carrito');
    const totalElem = document.getElementById('total-precio');
    lista.innerHTML = "";
    let total = 0;

    carrito.forEach((item, index) => {
        const sub = item.precio * item.cantidad;
        total += sub;
        lista.innerHTML += `
            <div class="item-carrito">
                <div><b>${item.nombre} (x${item.cantidad})</b><br><span style="color:var(--gold)">€${sub.toFixed(2)}</span></div>
                <button onclick="quitarDelCarrito(${index})" class="btn-borrar" style="padding:4px 8px; font-size:0.6rem;">${t.quitar}</button>
            </div>`;
    });
    totalElem.innerText = `€${total.toFixed(2)}`;
}

function enviarWhatsApp() {
    const t = traducciones[idiomaActual];
    const mesa = document.getElementById('input-mesa').value;
    
    if(!mesa || carrito.length === 0) {
        return alert(t.alerta_datos);
    }
    
    let mensaje = `*PEDIDO MESA ${mesa} - AIRES ESTORIL*\n\n`;
    
    carrito.forEach(i => {
        const subtotal = (i.precio * i.cantidad).toFixed(2);
        mensaje += `• ${i.nombre} ${i.cantidad > 1 ? `(x${i.cantidad})` : ''} - €${subtotal}\n`;
    });
    
    const totalTexto = document.getElementById('total-precio').innerText;
    mensaje += `\n*TOTAL: ${totalTexto}*`;
    
    // CAMBIA ESTE NÚMERO POR EL TUYO REAL:
    window.open(`https://wa.me/543751246552?text=${encodeURIComponent(mensaje)}`);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-admin-view').onclick = toggleAdmin;
    cargarMenu();
});
