"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Settings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#061a14] to-[#0b2a20] text-white p-8 -m-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <p className="text-green-400 text-sm mb-2">NÓVUA · CONFIGURACIÓN</p>
          <h1 className="text-3xl md:text-4xl font-semibold">Define cómo funciona tu sistema</h1>
          <p className="text-gray-300 mt-2 max-w-xl">
            Aquí defines cómo se calcula el valor de cada conversación, quién responde y cómo se prioriza el trabajo.
          </p>
        </div>

        <Card className="bg-green-500/10 border border-green-500/20 backdrop-blur-xl">
          <CardContent className="p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <p className="text-green-400 font-semibold text-white">Canal activo: WhatsApp</p>
              <p className="text-sm text-gray-200">Tu equipo ya está recibiendo y respondiendo conversaciones reales</p>
            </div>
            <Button className="bg-green-500 hover:bg-green-400 text-black">Actualizar conexión</Button>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Cómo se calcula el valor</h2>
                <p className="text-sm text-gray-200">
                  Define cuánto vale cada tipo de conversación. Esto determina qué aparece primero en el inbox.
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-200 mb-1">Nombre del negocio</p>
                <Input defaultValue="Clínica estética" />
              </div>

              <div>
                <p className="text-sm text-gray-200 mb-2">Tipos de consulta y valor estimado (€)</p>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input defaultValue="Primera visita" />
                    <Input defaultValue="60" />
                  </div>

                  <div className="flex gap-2">
                    <Input defaultValue="Tratamiento premium" />
                    <Input defaultValue="180" />
                  </div>
                </div>

                <Button variant="outline" className="mt-3">
                  + Añadir tipo de consulta
                </Button>
              </div>

              <Button className="bg-green-500 hover:bg-green-400 text-black w-full">Guardar cambios</Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Equipo que responde</h2>
                <p className="text-sm text-gray-200">
                  Define quién gestiona las conversaciones y cómo se reparten.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-white">Sara</p>
                    <p className="text-sm text-gray-200">Propietaria</p>
                  </div>
                  <Button variant="outline">Reasignar</Button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-white">Agente</p>
                    <p className="text-sm text-gray-200">Atención al cliente</p>
                  </div>
                  <Button variant="outline">Reasignar</Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Input placeholder="email@empresa.com" />
                <Button className="bg-green-500 hover:bg-green-400 text-black">Invitar usuario</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Feedback del sistema</h2>
              <p className="text-sm text-gray-200">
                Ayúdanos a mejorar Novua. ¿Qué no está funcionando o qué te gustaría cambiar?
              </p>
            </div>

            <Input placeholder="Escribe tu feedback aquí..." />

            <Button className="bg-green-500 hover:bg-green-400 text-black w-fit">Enviar feedback</Button>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-red-400">Eliminar sistema</h2>
              <p className="text-sm text-gray-200">
                Esta acción elimina el workspace, las conversaciones y toda la configuración. No se puede deshacer.
              </p>
            </div>

            <Input placeholder="Escribe el nombre del negocio para confirmar" />

            <Button variant="destructive" className="w-fit">
              Eliminar definitivamente
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
