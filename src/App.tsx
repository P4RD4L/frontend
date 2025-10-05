import { useEffect, useState, useRef, FormEvent, useMemo } from 'react'
import { FiTrash } from 'react-icons/fi'
import { api } from './service/api'
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import moment from 'moment'
import Modal from './components/Modal'
import { RadioGroup } from './components/RadioGroup'

interface ProductProps{
  id: string
  productName: string
  productId: string
  brand: string
  brandRelName: string
  weight: number
  market: string
  price: number
  status: boolean
  created_at: string
  productRelName: string
}

export default function App() {
  const [products, setProducts] = useState<ProductProps[]>([])
  const [productsTabela, setProductsTabela] = useState<ProductProps[]>([])
  const productRef = useRef<HTMLInputElement | null>(null)
  const brandRef = useRef<HTMLInputElement | null>(null)
  const weightRef = useRef<HTMLInputElement | null>(null)
  const marketRef = useRef<HTMLInputElement | null>(null)
  const priceRef = useRef<HTMLInputElement | null>(null)
  const [searchProduct, setSearchProduct] = useState('')
  const [searchMarket, setSearchMarket] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(new Date())
  const [openModal, setOpenModal] = useState<boolean>(false)
  const [selectedItem, setSelectedItem] = useState<ProductProps>()
  const [value, setValue] = useState<string | null>(null)
  const items: {value: string, label: string}[] = [
    {value: "peso", label: "Peso"},
    {value: "unidade", label: "Unidade"}
  ]
  const [sortConfig, setSortConfig] = useState<{ key: keyof ProductProps; direction: string }>({
    key: 'created_at',
    direction: 'descending',
  })

  const requestSort = (key: keyof ProductProps) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction })
  }
  

  useEffect(() => {
    LoadProducts()
  },[]);

  async function LoadProducts() {
    const response = await api.get("/products")
    const responsePrice = await api.get("/prices")

    setProducts(responsePrice.data)
    setProductsTabela(response.data)
  }

  async function handleSubmitProduct(event: FormEvent){
    event.preventDefault()
    if(!productRef.current?.value || !brandRef.current?.value || !weightRef.current?.value) return

    const response = await api.post("/product", {
      productName: productRef.current?.value,
      brand: brandRef.current?.value,
      weight: parseFloat(weightRef.current?.value),
      status: value ? false : true
    })

    setProducts(allProducts => [...allProducts, response.data]);
    productRef.current.value = "";
    brandRef.current.value = "";
    weightRef.current.value = "";
  }
  
  async function handleSubmitPrice(event: FormEvent){
    event.preventDefault()

    if(!priceRef.current?.value || !marketRef.current?.value) return

    const response = await api.post("/price", {
      price: parseFloat (priceRef.current?.value.replace(",", ".")),
      market: marketRef.current?.value,
      id: selectedItem?.id,
      productName: selectedItem?.productName
    })

    setProducts(allProducts => [...allProducts, response.data])
    setOpenModal(false);
    priceRef.current.value = "";
    marketRef.current.value = "";
  }

  async function handleDelete(id: string) {
    try {
      await api.delete("/product", {
        params: {
          id: id,
        }
      })
      const allProducts = products.filter((product) => product.id !== id)
      setProducts(allProducts)
    } catch (error) {
      console.log(error)     
    }
  }
  
  async function handleClick(id: ProductProps) {
    setSelectedItem(id)
    setOpenModal(true)
  }

  const filteredMarkets = products.filter((product) => {
      const productSearchTerm = (searchProduct || '').trim().toLowerCase()
      const marketSearchTerm = (searchMarket || '').trim().toLowerCase()

      const condicaoBuscaProduto = productSearchTerm.length === 0 || (
          product.productRelName.toLowerCase().includes(productSearchTerm)
      )

      const condicaoBuscaMercado = marketSearchTerm.length === 0 || (
          product.market.toLowerCase().includes(marketSearchTerm)
      )

      return condicaoBuscaProduto && condicaoBuscaMercado;
  })

  const sortedItems = useMemo(() => {
    // Decide qual array usar: o filtrado ou o completo
    const itemsToSort = searchMarket.length > 0 || searchProduct.length > 0 ? filteredMarkets : products;
    // Cria uma cópia para não modificar o array original
    const sortableItems = [...itemsToSort];

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // Pega os valores para comparar
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // LÓGICA DE COMPARAÇÃO
        let comparison = 0;

        // 1. Se for a coluna de data
        if (sortConfig.key === 'created_at') {
          const dateA = new Date(aValue as string).getTime();
          const dateB = new Date(bValue as string).getTime();
          comparison = dateA - dateB;
        }
        // 2. Se for uma coluna de número (ex: 'price')
        else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        }
        // 3. Se for uma coluna de texto (ex: 'market')
        else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        }
        // (Opcional) Se for uma coluna boolean
        else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          comparison = aValue === bValue ? 0 : aValue ? -1 : 1;
        }

        // Inverte o resultado se a direção for descendente
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }

    return sortableItems;
  }, [products, filteredMarkets, searchMarket, searchProduct, sortConfig]); // Dependências do useMemo

  console.log('Objeto selectedItem:', selectedItem);

  return(
    <div className="w-full min-h-screen bg-gray-800 flex justify-center px-4">
      <main className="my-10 w-full md:max-w-2xl">
        <h1 className="text-5xl font-medium text-white">Produtos</h1>

        <form className="flex flex-col my-6" onSubmit={handleSubmitProduct}>
          <label className="font-medium text-white">Produto</label>
          <input
            type="text"
            placeholder="Digite o nome do Produto"
            className="w-full mb-5 p-2 rounded"
            ref={productRef}
          />

          <label className="font-medium text-white">Marca</label>
          <input
            type="text"
            placeholder="Digite a marca do Produto"
            className="w-full mb-5 p-2 rounded"
            ref={brandRef}
          />

            <fieldset>
              <legend className="font-medium text-white">Unidade de Medida</legend>
                <RadioGroup
                  name="measure"
                  items={items}
                  value={value}
                  onChange={setValue}/>
            </fieldset>

          <input
            type="text"
            disabled={!value ? true : false}
            placeholder={ !value ? "Escolha a unidade de medida": "Digite o/a "+value+" do Produto"}
            className="w-full mb-5 p-2 rounded"
            ref={weightRef}
          />

          <input 
            type="submit"
            value="Cadastrar"
            className="cursor-pointer w-full p-2 bg-green-400 rounded font-medium"
          />
        </form>

        <div>
          <label className='text-white pr-4'>Selecione o mercado:</label>
          <select value={searchMarket} onChange={e => setSearchMarket(e.target.value)}>
            <option value="">Todos</option>
            <option value="Amigão">Amigão</option>
            <option value="Avanzi">Avanzi</option>
            <option value="Avenida">Avenida</option>
            <option value="Atacadão">Atacadão</option>
            <option value="Muffato">Muffato</option>
            <option value="São Judas">São Judas</option>
          </select>
        </div>

        <div className='py-6'>
          <label className='text-white pr-4'>Filtrar produto:</label>
          <input
            name='searchProduct'
            type='text'
            onChange={e => setSearchProduct(e.target.value)}
            value={searchProduct}
          />
        </div>

        <section className="flex gap-4 py-6"/>

        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)} //only when value has changed
          dateFormat={'dd/MM/yyyy'}
          //onSelect={} //when day is clicked
          //showTimeSelect //mostra seletor de hora
        />

        <section className="flex gap-4 py-6"/>

        <table className="border-collapse border-2 table-fixed w-full bg-white rounded p-2">
          <thead>
            <tr className="border-4">
              <th className="border-4">Mercado</th>
              <th className="border-4">Produto</th>
              <th className="border-4">Preço</th>
              <th 
              className="border-4 cursor-pointer" 
              onClick={() => requestSort('created_at')}>
                Alteração 
                {/* Indicador visual da ordenação */}
                {sortConfig.key === 'created_at' && (
                  sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((product, index) => (
              <tr
              key={index}
              className="border-collapse border-2 px-4 py-4 items-center"
              onClick={() => handleClick(product)}>
                <td className="px-4 py-1">{product.market}</td>
                <td className="px-4 py-1">{product.productRelName + " " + product.brandRelName}</td>
                <td className="px-4 py-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                    .format(product.price)}
                </td>
                <td className="px-4 py-1">
                  {moment(product.created_at).format('DD/MM/YYYY, HH:mm')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="flex gap-4 py-6"/>

        <section className="grid grid-cols-4 gap-4 py-6">
          {productsTabela.map((product, index) => (
            <article key={index}
              className="w-full bg-white rounded p-2 relative hover:scale-110 duration-200" 
              onClick={() => handleClick(product)}>
                    <p><span className="font-medium">{product.productName}</span></p>
                    <p><span className="font-medium">{product.brand}</span></p>
                    <p><span className="font-medium">{product.status ? "ATIVO" : "INATIVO"}</span></p>
                    <button
                      className='bg-red-600 w-7 h-7 flex items-center justify-center rounded-lg absolute right-0 -top-2'
                      onClick={() => handleDelete(product.id)}>
                      <FiTrash size={18} color="#FFF"/>
                    </button>
            </article>
          ))}
        </section>

        <section className="flex gap-4 py-6"/>

        <section className="flex flex-col gap-4 py-4">
          {products.map((product, index) => (
            <article key={index} className="w-full bg-white rounded p-2 relative hover:scale-110 duration-200">
              <p><span className="font-medium">{product.market}</span></p>
              <p><span className="font-medium">{product.price}</span></p>
              <p><span className="font-medium">{product.status ? "ATIVO" : "INATIVO"}</span></p>

              <button
                className='bg-red-600 w-7 h-7 flex items-center justify-center rounded-lg absolute right-0 -top-2'
                onClick={() => handleDelete(product.id)}>
                <FiTrash size={18} color="#FFF"/>
              </button>
            </article>
          ))}
        </section>

        <Modal openModal={openModal} onClose={() => setOpenModal(false)}>
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl">Alteração de Preço</h1>
            <h1 className="text-2xl">Produto: {selectedItem?.id}</h1>
            <p>
              Modal
            </p>
            <hr className="border-t-solid border-1 border-grey" />
            <input
              type='text'
              disabled= {true}
              className='bg-slate-100 py-3 px-4 rounded-lg border'
              placeholder='Seu texto aqui'
              defaultValue={selectedItem?.id}/>

            <input
              type='text'
              disabled= {true}
              className='bg-slate-100 py-3 px-4 rounded-lg border'
              placeholder='Digite o produto'
              // Use `?? ''` para garantir que seja uma string vazia se o valor for nulo/undefined
              defaultValue={`${selectedItem?.productRelName ?? ''} ${selectedItem?.brandRelName ?? ''}`.trim()}/>

            <input
              type='text'
              className='bg-slate-100 py-3 px-4 rounded-lg border'
              placeholder='Digite o supermercado'
              defaultValue={searchMarket ? searchMarket : ""}
              //defaultValue={selectedItem?.market}
              disabled= {searchMarket ? true : false}
              ref={marketRef}/>

            <input
              type='text'
              className='bg-slate-100 py-3 px-4 rounded-lg border'
              placeholder='Digite o preço'
              //defaultValue={selectedItem?.price}
              ref={priceRef}/>

            <div className="flex flex-row justify-center">
              <button
                className="border border-neutral-300 rounded-lg py-1.5 px-10
                bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleSubmitPrice}>
                Cadastrar
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  )
}

//      const allProducts = products.filter((product) => product.id !== id);
//      setProducts(allProducts);