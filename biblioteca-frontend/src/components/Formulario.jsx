import './Formulario.css'

/**
 * Componente de formulário genérico.
 *
 * Props de cada campo:
 * - name, label, type, required, options (para select), placeholder
 * - readOnly: true → exibe o valor mas não permite edição (campo bloqueado)
 * - info: string → texto de ajuda exibido abaixo do campo
 */
export default function Formulario({ campos, valores, onChange, onSubmit, textoBotao = 'Salvar', children }) {
  return (
    <form className="formulario" onSubmit={onSubmit}>
      {campos.map((campo) => (
        <div className="formulario-campo" key={campo.name}>
          <label htmlFor={campo.name}>
            {campo.label}
            {campo.readOnly && <span className="formulario-badge-readonly">somente leitura</span>}
          </label>

          {campo.type === 'select' ? (
            <select
              id={campo.name}
              name={campo.name}
              value={valores[campo.name] ?? ''}
              onChange={onChange}
              required={campo.required}
              disabled={campo.readOnly}
            >
              <option value="">Selecione...</option>
              {campo.options?.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={campo.name}
              type={campo.type ?? 'text'}
              name={campo.name}
              value={valores[campo.name] ?? ''}
              onChange={campo.readOnly ? undefined : onChange}
              readOnly={campo.readOnly}
              required={campo.required && !campo.readOnly}
              placeholder={campo.placeholder ?? ''}
              min={campo.min}
              max={campo.max}
              className={campo.readOnly ? 'input-readonly' : ''}
            />
          )}

          {campo.info && <p className="formulario-info">{campo.info}</p>}
        </div>
      ))}

      {children}

      <button type="submit" className="formulario-btn">
        {textoBotao}
      </button>
    </form>
  )
}
