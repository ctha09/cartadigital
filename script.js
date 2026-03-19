/**
 * Lógica de Carrito y WhatsApp
 * Programada por: Carlos Thomas Acosta
 */

const TELEFONO_WHATSAPP = "543751246552";
let carrito = [];

function agregarAlCarrito(producto, precio) {
    // Agregar al arreglo
    carrito.push({ nombre: producto, precio: precio });
    
    // Feedback visual simple (opcional)
    console.log("Agregado: " + producto);
    
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const lista = document.getElementById('lista-carrito');
    const totalTxt = document.getElementById('total-precio');
    
    lista.innerHTML = "";
    let suma = 0;

    if (carrito.length === 0) {
        lista.innerHTML = '<p style="text-align: center; opacity: 0.5;">El carrito está vacío</p>';
    } else {
        carrito.forEach((item) => {
            suma += item.precio;
            lista.innerHTML += `
                <div class="item-carrito">
                    <span>${item.nombre}</span>
                    <span>$${item.precio}</span>
                </div>
            `;
        });
    }

    totalTxt.innerText = `$${suma}`;
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;

    if (carrito.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    if (!mesa) {
        alert("Por favor, ingresa el número de mesa.");
        return;
    }

    let detalle = "";
    let totalPedido = 0;

    carrito.forEach(item => {
        detalle += `• ${item.nombre} ($${item.precio})\n`;
        totalPedido += item.precio;
    });

    const texto = encodeURIComponent(
        `*NUEVO PEDIDO - MESA ${mesa}*\n` +
        `----------------------------------\n` +
        detalle +
        `----------------------------------\n` +
        `*TOTAL: $${totalPedido}*\n\n` +
        `_Enviado desde el Menú Digital_`
    );

    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${texto}`, '_blank');
}
