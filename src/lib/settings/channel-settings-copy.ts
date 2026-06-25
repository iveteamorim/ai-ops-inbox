import type { ChannelType } from "@/lib/messaging/channel-types";

function replyEmailFieldLabels(lang: string) {
  if (lang === "pt") {
    return {
      email: "O teu email",
      sendCode: "Confirmar",
      code: "Código",
      confirm: "Listo",
      verified: "Confirmado",
      pending: "Enviamos um código para o teu email.",
      codeSent: "Código enviado.",
      error: "Não foi possível enviar o código.",
      invalidCode: "Código inválido.",
    };
  }

  if (lang === "en") {
    return {
      email: "Your email",
      sendCode: "Confirm",
      code: "Code",
      confirm: "Done",
      verified: "Confirmed",
      pending: "We sent a code to your email.",
      codeSent: "Code sent.",
      error: "Could not send the code.",
      invalidCode: "Invalid code.",
    };
  }

  return {
    email: "Tu email",
    sendCode: "Confirmar",
    code: "Código",
    confirm: "Listo",
    verified: "Confirmado",
    pending: "Te enviamos un código a tu email.",
    codeSent: "Código enviado.",
    error: "No se pudo enviar el código.",
    invalidCode: "Código inválido.",
  };
}

export function getChannelsOverviewCopy(lang: string) {
  if (lang === "pt") {
    return {
      title: "Canais do workspace",
      subtitle: "WhatsApp, Instagram, email e web no mesmo inbox operacional.",
      connected: "Conectado",
      pending: "Pendente",
      disconnected: "Desconectado",
      comingSoon: "Em breve",
      configure: "Configurar",
      tiles: {
        whatsapp: {
          label: "WhatsApp",
          description: "Recebe e responde mensagens do número conectado.",
        },
        instagram: {
          label: "Instagram",
          description: "DMs e respostas do Instagram no mesmo inbox.",
        },
        email: {
          label: "Email",
          description: "Recebe leads por email e responde a partir do inbox.",
        },
        form: {
          label: "Web",
          description: "Leads do formulário do site dentro da Novua.",
        },
      } satisfies Record<ChannelType, { label: string; description: string }>,
    };
  }

  if (lang === "en") {
    return {
      title: "Workspace channels",
      subtitle: "WhatsApp, Instagram, email, and web in one operational inbox.",
      connected: "Connected",
      pending: "Pending",
      disconnected: "Disconnected",
      comingSoon: "Coming soon",
      configure: "Configure",
      tiles: {
        whatsapp: {
          label: "WhatsApp",
          description: "Receive and reply from the connected number.",
        },
        instagram: {
          label: "Instagram",
          description: "Instagram DMs and replies in the same inbox.",
        },
        email: {
          label: "Email",
          description: "Receive email leads and reply from the inbox.",
        },
        form: {
          label: "Web",
          description: "Website form leads routed into Novua.",
        },
      } satisfies Record<ChannelType, { label: string; description: string }>,
    };
  }

  return {
    title: "Canales del workspace",
    subtitle: "WhatsApp, Instagram, email y web en el mismo inbox operativo.",
    connected: "Conectado",
    pending: "Pendiente",
    disconnected: "Desconectado",
    comingSoon: "Próximamente",
    configure: "Configurar",
    tiles: {
      whatsapp: {
        label: "WhatsApp",
        description: "Recibe y responde desde el número conectado.",
      },
      instagram: {
        label: "Instagram",
        description: "DMs y respuestas de Instagram en el mismo inbox.",
      },
      email: {
        label: "Email",
        description: "Recibe leads por email y responde desde el inbox.",
      },
      form: {
        label: "Web",
        description: "Leads del formulario web dentro de Novua.",
      },
    } satisfies Record<ChannelType, { label: string; description: string }>,
  };
}

export function getChannelSetupCopy(lang: string) {
  if (lang === "pt") {
    return {
      whatsapp: {
        title: "Conectar WhatsApp",
        description: "Recebe e responde mensagens do número conectado.",
      },
      instagram: {
        title: "Conectar Instagram",
        description: "Recebe DMs e respostas do Instagram no mesmo inbox da Novua.",
      },
      email: {
        title: "Conectar email",
        description: "Centraliza email recebido e respostas num inbox partilhado.",
      },
      form: {
        title: "Conectar web",
        description: "Encaminha leads de formulário e chat do site para a Novua.",
      },
    };
  }

  if (lang === "en") {
    return {
      whatsapp: {
        title: "Connect WhatsApp",
        description: "Receive and reply from the connected number.",
      },
      instagram: {
        title: "Connect Instagram",
        description: "Receive Instagram DMs and replies in the same Novua inbox.",
      },
      email: {
        title: "Connect email",
        description: "Centralize inbound email and threaded replies in one shared inbox.",
      },
      form: {
        title: "Connect web",
        description: "Route website form and chat leads into Novua.",
      },
    };
  }

  return {
    whatsapp: {
      title: "Conectar WhatsApp",
      description: "Recibe y responde desde el número conectado.",
    },
    instagram: {
      title: "Conectar Instagram",
      description: "Recibe DMs y respuestas de Instagram en el mismo inbox de Novua.",
    },
    email: {
      title: "Conectar email",
      description: "Centraliza el email entrante y las respuestas en un inbox compartido.",
    },
    form: {
      title: "Conectar web",
      description: "Enruta leads de formulario y chat web hacia Novua.",
    },
  };
}

export function getEmailChannelSetupCopy(
  lang: string,
  channelCopy: { title: string; description: string },
) {
  const overview = getChannelsOverviewCopy(lang);
  const replyEmailFieldLabelsValue = replyEmailFieldLabels(lang);
  const emailReplyLabels = {
    title:
      lang === "pt"
        ? "Email para responder a clientes de email"
        : lang === "en"
          ? "Email to reply to email clients"
          : "Email para responder a clientes de email",
    help:
      lang === "pt"
        ? "Respostas às conversas do canal email."
        : lang === "en"
          ? "Replies to conversations from the email channel."
          : "Respuestas a conversaciones del canal email.",
    ...replyEmailFieldLabelsValue,
  };

  if (lang === "pt") {
    return {
      title: channelCopy.title,
      description: "Escolhe o email para responderes a clientes de email.",
      connected: overview.connected,
      disconnected: overview.disconnected,
      agentNote: "Só owners e admins podem configurar o canal email.",
      replyLabels: emailReplyLabels,
    };
  }

  if (lang === "en") {
    return {
      title: channelCopy.title,
      description: "Pick the email to reply to email channel clients.",
      connected: overview.connected,
      disconnected: overview.disconnected,
      agentNote: "Only owners and admins can configure the email channel.",
      replyLabels: emailReplyLabels,
    };
  }

  return {
    title: channelCopy.title,
    description: "Elige el email para responder a clientes de email.",
    connected: overview.connected,
    disconnected: overview.disconnected,
    agentNote: "Solo owners y admins pueden configurar el canal email.",
    replyLabels: emailReplyLabels,
  };
}

export function getFormChannelSetupCopy(
  lang: string,
  channelCopy: { title: string; description: string },
  overview: ReturnType<typeof getChannelsOverviewCopy>,
) {
  const replyEmailFieldLabelsValue = replyEmailFieldLabels(lang);
  const formReplyLabels = {
    title:
      lang === "pt"
        ? "Email para responder a formulários"
        : lang === "en"
          ? "Email to reply to form leads"
          : "Email para responder a formularios",
    help:
      lang === "pt"
        ? "Respostas aos leads do teu formulário web."
        : lang === "en"
          ? "Replies to leads from your web form."
          : "Respuestas a leads de tu formulario web.",
    ...replyEmailFieldLabelsValue,
  };

  if (lang === "pt") {
    return {
      title: channelCopy.title,
      description: channelCopy.description,
      connected: overview.connected,
      disconnected: overview.disconnected,
      activate: "Ativar formulário web",
      regenerate: "Gerar novo link",
      websiteLink: "Link para a tua web",
      websiteLinkHelp: "Cola este link no botão Contacto, Reservar ou Solicitar diagnóstico.",
      step1: "Ativa o canal web.",
      step2: "Copia o link abaixo.",
      step3: "Cola no botão de contacto do teu site. Os leads entram no inbox.",
      openForm: "Abrir formulário",
      advanced: "Opções avançadas (API, embed, cópia Google Forms)",
      endpoint: "Endpoint API",
      token: "Token técnico",
      embed: "Código embed",
      copy: "Copiar",
      copied: "Copiado",
      help: "Um clique para ativar. Depois só copias um link para o teu site.",
      agentNote: "Só owners e admins podem ativar o formulário web.",
      error: "Não foi possível ativar o formulário web.",
      backupTitle: "Cópia de segurança externa",
      backupHelp:
        "Cada workspace pode enviar uma cópia para o Google Forms (ou outro destino no futuro). Assim manténs o histórico fora da Novua se um dia deixares de usar o inbox.",
      backupActionUrl: "URL do Google Form (viewform ou formResponse)",
      backupEntryName: "Campo entry do nome",
      backupEntryEmail: "Campo entry do email",
      backupEntryPhone: "Campo entry do telefone",
      backupEntryMessage: "Campo entry da mensagem",
      backupSave: "Guardar cópia de segurança",
      backupSaved: "Cópia de segurança guardada.",
      backupError: "Não foi possível guardar a cópia de segurança.",
      backupActive: "Cópia externa ativa para este workspace.",
      backupProvider: "Google Forms",
      replyLabels: formReplyLabels,
    };
  }

  if (lang === "en") {
    return {
      title: channelCopy.title,
      description: channelCopy.description,
      connected: overview.connected,
      disconnected: overview.disconnected,
      activate: "Activate web form",
      regenerate: "Generate new link",
      websiteLink: "Link for your website",
      websiteLinkHelp: "Paste this link on your Contact, Book, or Request diagnosis button.",
      step1: "Activate the web channel.",
      step2: "Copy the link below.",
      step3: "Paste it on your site's contact button. Leads land in your inbox.",
      openForm: "Open form",
      advanced: "Advanced options (API, embed, Google Forms backup)",
      endpoint: "API endpoint",
      token: "Technical token",
      embed: "Embed code",
      copy: "Copy",
      copied: "Copied",
      help: "One click to activate. Then copy one link for your website.",
      agentNote: "Only owners and admins can activate the web form.",
      error: "Could not activate the web form.",
      backupTitle: "External backup copy",
      backupHelp:
        "Each workspace can forward a copy to its own Google Form. You keep history outside Novua if you ever stop using the inbox.",
      backupActionUrl: "Google Form URL (viewform or formResponse)",
      backupEntryName: "Name entry field",
      backupEntryEmail: "Email entry field",
      backupEntryPhone: "Phone entry field",
      backupEntryMessage: "Message entry field",
      backupSave: "Save backup copy",
      backupSaved: "Backup copy saved.",
      backupError: "Could not save the backup copy.",
      backupActive: "External backup is active for this workspace.",
      backupProvider: "Google Forms",
      replyLabels: formReplyLabels,
    };
  }

  return {
    title: channelCopy.title,
    description: channelCopy.description,
    connected: overview.connected,
    disconnected: overview.disconnected,
    activate: "Activar formulario web",
    regenerate: "Generar nuevo enlace",
    websiteLink: "Enlace para tu web",
    websiteLinkHelp: 'Pega este enlace en el botón Contacto, Reservar o "Solicitar diagnóstico".',
    step1: "Activa el canal web.",
    step2: "Copia el enlace de abajo.",
    step3: "Pégalo en el botón de contacto de tu sitio. Los leads entran al inbox.",
    openForm: "Abrir formulario",
    advanced: "Opciones avanzadas (API, embed, copia Google Forms)",
    endpoint: "Endpoint API",
    token: "Token técnico",
    embed: "Código embed",
    copy: "Copiar",
    copied: "Copiado",
    help: "Un clic para activar. Luego solo copias un enlace para tu web.",
    agentNote: "Solo owners y admins pueden activar el formulario web.",
    error: "No se pudo activar el formulario web.",
    backupTitle: "Copia de seguridad externa",
    backupHelp:
      "Cada workspace puede enviar una copia a su propio Google Forms. Así conservas el histórico fuera de Novua si algún día dejas de usar el inbox.",
    backupActionUrl: "URL de Google Forms (viewform o formResponse)",
    backupEntryName: "Campo entry del nombre",
    backupEntryEmail: "Campo entry del email",
    backupEntryPhone: "Campo entry del teléfono",
    backupEntryMessage: "Campo entry del mensaje",
    backupSave: "Guardar copia de seguridad",
    backupSaved: "Copia de seguridad guardada.",
    backupError: "No se pudo guardar la copia de seguridad.",
    backupActive: "Copia externa activa para este workspace.",
    backupProvider: "Google Forms",
    replyLabels: formReplyLabels,
  };
}
