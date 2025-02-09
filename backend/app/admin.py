from flask_admin import Admin # type: ignore
from flask_admin.contrib.sqla import ModelView # type: ignore
from flask_admin.form import Select2Field # type: ignore
from app import db
from app.models import Enderecos, Clinicas, Colaboradores, Clientes, Servicos, Planos, Agendamentos, Pagamentos, Faturas

# Customizações de ModelView para melhor exibição de dados relacionados

class EnderecosModelView(ModelView):
    column_list = ('id_endereco', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'clientes', 'colaboradores', 'clinicas')
    form_columns = ('rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado')
    column_searchable_list = ('rua', 'bairro', 'cidade', 'estado')

class ClinicasModelView(ModelView):
    column_list = ('id_clinica', 'cnpj', 'nome', 'telefone', 'endereco', 'colaboradores')
    form_columns = ('cnpj', 'nome', 'telefone', 'endereco')  # Incluindo 'endereco'
    column_searchable_list = ('nome', 'cnpj', 'telefone')

    # Tornando o campo 'endereco' um SelectField
    form_extra_fields = {
        'endereco': Select2Field('Endereço', coerce=int, 
                                 query_factory=lambda: Enderecos.query.all(), 
                                 get_label=lambda e: f"{e.rua}, {e.bairro}, {e.cidade}, {e.estado}")
    }

    # Se necessário, use 'form_overrides' para garantir que 'endereco' seja tratado corretamente
    form_overrides = {
        'endereco': Select2Field
    }

    def on_model_change(self, form, model, is_created):
        """Garante que o endereço seja atribuído corretamente quando a clínica for salva."""
        if is_created and form.endereco.data:
            endereco = Enderecos.query.get(form.endereco.data)
            model.endereco = endereco
        return super(ClinicasModelView, self).on_model_change(form, model, is_created)

# ModelView para Colaboradores
class ColaboradoresModelView(ModelView):
    column_list = ('id_colaborador', 'nome', 'telefone', 'email', 'cargo', 'clinica', 'endereco')
    form_columns = ('nome', 'telefone', 'email', 'senha', 'cargo', 'cpf', 'sexo', 'dt_nasc', 'is_admin', 'admin_nivel', 'referencias', 'photo', 'endereco', 'clinica')
    column_searchable_list = ('nome', 'email', 'telefone', 'cpf')
    form_widget_args = {
        'senha': {'type': 'password'},
    }

# ModelView para Clientes
class ClientesModelView(ModelView):
    column_list = ('id_cliente', 'nome', 'telefone', 'email', 'cpf', 'endereco', 'email_confirmado')
    form_columns = ('nome', 'telefone', 'email', 'senha', 'cpf', 'sexo', 'dt_nasc', 'referencias', 'photo', 'endereco', 'email_confirmado')
    column_searchable_list = ('nome', 'email', 'telefone', 'cpf')

# ModelView para Serviços
class ServicosModelView(ModelView):
    column_list = ('id_servico', 'nome', 'descricao', 'valor', 'tipo_servicos', 'colaboradores')
    form_columns = ('nome', 'descricao', 'valor', 'tipo_servicos', 'colaboradores')
    column_searchable_list = ('nome', 'descricao')

# ModelView para Planos
class PlanosModelView(ModelView):
    column_list = ('id_plano', 'nome', 'descricao', 'valor', 'servico')
    form_columns = ('nome', 'descricao', 'valor', 'servico')
    column_searchable_list = ('nome', 'descricao')

# ModelView para Agendamentos
class AgendamentosModelView(ModelView):
    column_list = ('id_agendamento', 'data_e_hora', 'cliente', 'colaborador', 'servico', 'status', 'clinica')
    form_columns = ('data_e_hora', 'cliente', 'colaborador', 'servico', 'status', 'clinica')
    column_searchable_list = ('data_e_hora', 'status')
    
# ModelView para Pagamentos
class PagamentosModelView(ModelView):
    column_list = ('id_pagamento', 'id_agendamento', 'valor', 'metodo_pagamento', 'status')
    form_columns = ('id_agendamento', 'valor', 'metodo_pagamento', 'status')
    column_searchable_list = ('metodo_pagamento', 'status')

class FaturasModelView(ModelView):
    # Correcting column_list to show the correct fields in the view
    column_list = ('id_fatura', 'id_pagamento', 'valor_total', 'status', 'data_emissao', 'vencimento')
    
    # Defining the form columns
    form_columns = ('id_pagamento', 'valor_total', 'status', 'data_emissao', 'vencimento')

    # Adding searchable fields
    column_searchable_list = ('status',)

    # Displaying related agendamento via pagamento
    def _list_agendamento(view, context, model, name):
        # You can access the agendamento through the pagamento relationship
        return model.pagamento.agendamento.id_agendamento if model.pagamento else None
    
    column_formatters = {
        'id_agendamento': _list_agendamento
    }




def init_admin(app):
    admin = Admin(app, name="Painel Administrativo", template_mode="bootstrap4")

    # Registra as views personalizadas
    admin.add_view(EnderecosModelView(Enderecos, db.session))
    admin.add_view(ClinicasModelView(Clinicas, db.session))
    admin.add_view(ColaboradoresModelView(Colaboradores, db.session))
    admin.add_view(ClientesModelView(Clientes, db.session))
    admin.add_view(ServicosModelView(Servicos, db.session))
    admin.add_view(PlanosModelView(Planos, db.session))
    admin.add_view(AgendamentosModelView(Agendamentos, db.session))
    admin.add_view(PagamentosModelView(Pagamentos, db.session))
    admin.add_view(FaturasModelView(Faturas, db.session))
