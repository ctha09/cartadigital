/**
 * Lógica de Carrito y WhatsApp
 * Programada por: Carlos Thomas Acosta
 */

const TELEFONO_WHATSAPP = "543751246552";
let carrito = [];

// Agrega un producto al array y actualiza la vista
function agregarAlCarrito(producto, precio) {
    carrito.push({ nombre: producto, precio: precio });
    renderizarCarrito();
}

// Dibuja el contenido del carrito en el HTML
function renderizarCarrito() {
    const contenedor = document.getElementById('lista-carrito');
    const totalElemento = document.getElementById('total-precio');
    
    contenedor.innerHTML = "";
    let acumulado = 0;

    if (carrito.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; opacity: 0.5;">El carrito está vacío</p>';
    } else {
        carrito.forEach((item, index) => {
            acumulado += item.precio;
            contenedor.innerHTML += `
                <div class="item-carrito">
                    <span>${item.nombre}</span>
                    <span>$${item.precio}</span>
                </div>
            `;
        });
    }

    totalElemento.innerText = `$${acumulado}`;
}

// Procesa el pedido y abre WhatsApp
function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;

    if (carrito.length === 0) {
        alert("¡Tu carrito está vacío!");
        return;
    }

    if (!mesa) {
        alert("Por favor, ingresa el número de tu mesa.");
        return;
    }

    // Armar el listado de productos
    let listado = "";
    let totalFinal = 0;

    carrito.forEach(item => {
        listado += `• ${item.nombre} ($${item.precio})\n`;
        totalFinal += item.precio;
    });

    // Crear el mensaje formateado
    const mensaje = encodeURIComponent(
        `*NUEVO PEDIDO - MESA ${mesa}*\n` +
        `----------------------------------\n` +
        listado +
        `----------------------------------\n` +
        `*TOTAL A PAGAR: $${totalFinal}*\n\n` +
        `_Enviado desde el Menú Digital_`
    );

    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${mensaje}`, '_blank');
}
