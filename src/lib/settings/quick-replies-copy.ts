export function getQuickRepliesFormCopy(lang: string) {
  if (lang === "pt") {
    return {
      title: "Respostas frequentes",
      help: "Guarde horários, preços e respostas repetitivas. A equipa insere com um clique e a Novua sugere automaticamente quando o cliente pergunta algo parecido.",
      replyTitle: "Nome curto",
      replyKeywords: "Palavras-chave (separadas por vírgula)",
      replyKeywordsHelp: "Ex.: horario, preco, precio, info, servico, produto",
      replyText: "Resposta aprovada",
      addReply: "+ Adicionar resposta",
      removeReply: "Remover",
      loadExamples: "Carregar exemplos",
      save: "Guardar respostas",
      saving: "A guardar...",
      success: "Respostas guardadas.",
      error: "Não foi possível guardar as respostas.",
      empty: "Ainda não há respostas frequentes. Adicione horário, preços ou localização.",
    };
  }

  if (lang === "en") {
    return {
      title: "Frequent replies",
      help: "Store hours, prices, and repetitive answers. Your team inserts them with one click and Novua suggests them when a customer asks something similar.",
      replyTitle: "Short name",
      replyKeywords: "Keywords (comma-separated)",
      replyKeywordsHelp: "E.g. hours, price, precio, info, service, product",
      replyText: "Approved reply",
      addReply: "+ Add reply",
      removeReply: "Remove",
      loadExamples: "Load examples",
      save: "Save replies",
      saving: "Saving...",
      success: "Replies saved.",
      error: "Could not save replies.",
      empty: "No frequent replies yet. Add opening hours, pricing, or location.",
    };
  }

  return {
    title: "Respuestas frecuentes",
    help: "Guarda horarios, precios y respuestas repetitivas. El equipo las inserta con un clic y Novua las sugiere cuando el cliente pregunta algo parecido.",
    replyTitle: "Nombre corto",
    replyKeywords: "Palabras clave (separadas por coma)",
    replyKeywordsHelp: "Ej.: horario, precio, info, servicio, producto",
    replyText: "Respuesta aprobada",
    addReply: "+ Añadir respuesta",
    removeReply: "Eliminar",
    loadExamples: "Cargar ejemplos",
    save: "Guardar respuestas",
    saving: "Guardando...",
    success: "Respuestas guardadas.",
    error: "No se pudieron guardar las respuestas.",
    empty: "Todavía no hay respuestas frecuentes. Añade horario, precios o ubicación.",
  };
}
