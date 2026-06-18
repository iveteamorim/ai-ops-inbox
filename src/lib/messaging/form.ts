export type FormLeadPayload = {
  token?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
};

export function cleanFormField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeFormLead(body: FormLeadPayload) {
  const token = cleanFormField(body.token);
  const name = cleanFormField(body.name);
  const email = cleanFormField(body.email);
  const phone = cleanFormField(body.phone);
  const message = cleanFormField(body.message);

  if (!token) {
    return { ok: false as const, error: "token_required" };
  }

  if (!name) {
    return { ok: false as const, error: "name_required" };
  }

  if (!message) {
    return { ok: false as const, error: "message_required" };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "invalid_email" };
  }

  if (name.length > 120 || message.length > 4000) {
    return { ok: false as const, error: "payload_too_large" };
  }

  return {
    ok: true as const,
    value: {
      token,
      name,
      email: email || null,
      phone: phone || null,
      message,
    },
  };
}

export function buildFormEmbedSnippet(appUrl: string, token: string) {
  const endpoint = `${appUrl}/api/leads/form`;

  return `<form id="novua-lead-form">
  <input name="name" placeholder="Nombre" required />
  <input name="email" type="email" placeholder="Email" />
  <input name="phone" type="tel" placeholder="Teléfono" />
  <textarea name="message" placeholder="Mensaje" required></textarea>
  <button type="submit">Enviar</button>
</form>
<script>
(function () {
  var form = document.getElementById("novua-lead-form");
  if (!form) return;
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(form);
    fetch("${endpoint}", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "${token}",
        name: data.get("name"),
        email: data.get("email"),
        phone: data.get("phone"),
        message: data.get("message"),
      }),
    })
      .then(function (response) { return response.json(); })
      .then(function (result) {
        if (result && result.ok) {
          form.reset();
          alert("Mensaje enviado");
        } else {
          alert("No se pudo enviar el mensaje");
        }
      })
      .catch(function () {
        alert("No se pudo enviar el mensaje");
      });
  });
})();
</script>`;
}
