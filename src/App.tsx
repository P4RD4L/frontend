import { useEffect, useState, useRef, FormEvent } from 'react'
import { FiTrash } from 'react-icons/fi'
import { api } from './service/api'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
import Modal from './components/Modal';

interface ProductProps{
  id: string;
  productName: string;
  market: string;
  price: number;
  status: boolean;
  created_at: string;
}

export default function App() {
  const [products, setProducts] = useState<ProductProps[]>([]);
  const productRef = useRef<HTMLInputElement | null>(null);
  const marketRef = useRef<HTMLInputElement | null>(null);
  const priceRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ProductProps>();

  useEffect(() => {
    LoadProducts();
  },[]);

  async function LoadProducts() {
    const response = await api.get("/products");

    //response.sort((a, b) => b.data - a.data);
    //setProducts(response.data.sort((a: { data: number; }, b: { data: number; }) => b.data - a.data));

    setProducts(response.data)
  }

  async function handleSubmit(event: FormEvent){
    event.preventDefault();

    if(!productRef.current?.value || !marketRef.current?.value || !priceRef.current?.value) return;

    const response = await api.post("/product", {
      productName: productRef.current?.value,
      market: marketRef.current?.value,
      price: priceRef.current?.value.replace(",", ".")
    })

    setProducts(allProducts => [...allProducts, response.data])

    productRef.current.value = "";
    marketRef.current.value = "";
    priceRef.current.value = "";
  }

  async function handleDelete(id: string) {
    try {
      await api.delete("/product", {
        params: {
          id: id,
        }
      })
      const allProducts = products.filter((product) => product.id !== id);
      setProducts(allProducts);
    } catch (error) {
      console.log(error);      
    }
  }
  
  async function handleClick(id: ProductProps) {
      //console.log('selecionado: '+id);
      setSelectedItem(id);
      setOpenModal(true)
  }

  const filteredMarkets = search.length > 0
  ? products.filter(product => product.market.toLowerCase().includes(search.toLowerCase()))
  : [];

  //const filteredProducts = search.length > 0
  //? products.filter(product => product.created_at.indexOf()
    //productName.toLowerCase().includes(search.toLowerCase()))
  //: [];

  return(
    <div className="w-full min-h-screen bg-gray-800 flex justify-center px-4">
      <main className="my-10 w-full md:max-w-2xl">
        <h1 className="text-5xl font-medium text-white">Produtos</h1>

        <form className="flex flex-col my-6" onSubmit={handleSubmit}>
          <label className="font-medium text-white">Produto</label>
          <input
            type="text"
            placeholder="Digite o nome do Produto"
            className="w-full mb-5 p-2 rounded"
            ref={productRef}
          />

          <label className="font-medium text-white">Supermercado</label>
          <input
            type="text"
            placeholder="Digite o nome do Supermercado"
            className="w-full mb-5 p-2 rounded"
            ref={marketRef}
          />

          <label className="font-medium text-white">Preço</label>
          <input
            type="text"
            placeholder="Digite o Preço do Produto"
            className="w-full mb-5 p-2 rounded"
            ref={priceRef}
          />

          <input 
            type="submit"
            value="Cadastrar"
            className="cursor-pointer w-full p-2 bg-green-400 rounded font-medium"
          />
        </form>

        <div>
          <label className='text-white pr-4'>Selecione o mercado</label>
          <select value={search} onChange={e => setSearch(e.target.value)}>
            <option value="">Todos</option>
            <option value="Avenida">Avenida</option>
            <option value="Amigão">Amigão</option>
            <option value="Atacadão">Atacadão</option>
            <option value="São Judas">São Judas</option>
          </select>
        </div>

        <div className='py-6'>
          <input
            name='search'
            type='text'
            onChange={e => setSearch(e.target.value)}
            value={search}
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
              <th className="border-4">Alteração</th>
            </tr>
          </thead>
          <tbody>
            {search.length > 0 ? (
              <>
                {filteredMarkets.map((product, index) => (
                  <tr key={index} className="border-collapse border-2 px-4 py-4 items-center">
                    <td  className="">{product.market}</td>
                    <td className="">{product.productName}</td>
                    <td className=""> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                      .format(product.price)}</td>
                    <td className="">{moment(product.created_at)
                        .format('DD/MM/YYYY, HH:mm')}</td>
                  </tr>
                ))}
              </>
            ) : (
              <>
                {products.map((product, index) => (
                  <tr key={index} className="border-collapse border-2 px-4 py-4 items-center">
                    <td className="px-4 py-1">{product.market}</td>
                    <td className="px-4 py-1">{product.productName}</td>
                    <td className="px-4 py-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                      .format(product.price)}</td>
                    <td className="px-4 py-1">{moment(product.created_at)
                      .format('DD/MM/YYYY, HH:mm')}</td>
                  </tr>
                ))}
                </>
            )}
          </tbody>
        </table>

        <section className="flex gap-4 py-6"/>

        <section className="flex flex-col gap-4 py-4">
          {products.map((product) => (
            <article key={product.id} className="w-full bg-white rounded p-2 relative hover:scale-110 duration-200">
              <p><span className="font-medium">{product.productName}</span></p>
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

        <section className="grid grid-cols-4 gap-4 py-6">
          {products.map((product, index) => (
            <article key={index}
              className="w-full bg-white rounded p-2 relative hover:scale-110 duration-200" 
              onClick={() => handleClick(product)}>

              <p><span className="font-medium">{product.market}</span></p>
              <p><span className="font-medium">{product.productName}</span></p>
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

        <section className="flex gap-4 py-6"/>

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
                  placeholder='Seu texto aqui'
                  defaultValue={selectedItem?.productName}/>

                  <input
                  type='text'
                  className='bg-slate-100 py-3 px-4 rounded-lg border'
                  placeholder='Seu texto aqui'
                  defaultValue={selectedItem?.price}/>

                <div className="flex flex-row justify-center">
                  <button
                    className="border border-neutral-300 rounded-lg py-1.5 px-10
                    bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => setOpenModal(false)}>
                    Close
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