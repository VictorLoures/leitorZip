import './App.css';
import JSZip from 'jszip';
import { useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  UncontrolledAccordion,
  AccordionBody,
  AccordionHeader,
  AccordionItem,
  Button,
  FormGroup,
  Modal,
  ModalHeader,
  ModalBody,
  Label,
  Input,
  Spinner
} from 'reactstrap';
import { anos } from './files/enums';

const anoAtual = new Date().getFullYear();
const XLSX = require('xlsx');

const styleDisabled = {
  backgroundColor: 'gray',
  borderColor: 'gray'
};

const formatBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

function App() {
  const [path, setPath] = useState(null);
  const [pathPrefeitura, setPathPrefeitura] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [fileNamePref, setFileNamePref] = useState(null);
  const [informarAno, setInformarAno] = useState(false);
  const [anoInformado, setAnoInformado] = useState(null);
  const [infoGestor, setInfoGestor] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showResultPref, setShowResultPref] = useState(false);
  const [showResultSum, setShowResultSum] = useState(false);
  const [showResultPrefSemNotas, setShowResultPrefSemNotas] = useState(false);
  const [notasPresentesGestor, setNotasPresentesGestor] = useState(null);
  const [notasPresentesZip, setNotasPresentesZip] = useState(null);
  const [mapNotasPref, setMapNotasPref] = useState(null);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState(false);
  const [notas, setNotas] = useState(null);

  const [resultSum, setResultSum] = useState('');

  const [modalComparacao, setModalComparacao] = useState(false);
  const [modalComparacaoPrefeitura, setModalComparacaoPrefeitura] = useState(false);
  const [notasGestor, setNotasGestor] = useState(null);

  const fileRef = useRef(null);

  const toggle = () => {
    setModal(!modal);
  };

  const toggleComparacao = () => {
    if (modalComparacao) {
      setInfoGestor(null);
      setShowResult(false);
      setPath(null);
      setFileName(null);
      setNotasPresentesGestor(null);
      setNotasPresentesZip(null);
    }
    setModalComparacao(!modalComparacao);
  };

  const toggleComparacaoPrefeitura = () => {
    if (!modalComparacaoPrefeitura) {
      setInfoGestor(null);
      setShowResultPref(false);
      setShowResultPrefSemNotas(false);
      setMapNotasPref(null);
    }
    setModalComparacaoPrefeitura(!modalComparacaoPrefeitura);
  };

  const setZip = (file) => {
    const fileData = file.target.files[0];
    setPath(fileData);
    setFileName(getNameFmt(file));
    listarNotas(fileData);
  };

  const setArquivoPrefeitura = (file = null) => {
    if (file) {
      setPathPrefeitura(file.target.files[0]);
      setFileNamePref(getNameFmt(file));
    } else {
      setPathPrefeitura(null);
      setFileNamePref('');
    }
  };

  const getNameFmt = (file) => {
    const name = file.target.value;
    return name.substring(name.lastIndexOf('\\') + 1, name.indexOf('.'));
  };

  const listarNotas = (file = path) => {
    const zip = JSZip();
    zip.loadAsync(file).then(function (res) {
      if (res.files) {
        const keys = Object.keys(res.files);
        const notasOrdenadas = [];
        keys.forEach((key) => {
          if (key.includes('.xml')) {
            const index = res.files[key].name.lastIndexOf('.xml') - 11;
            const name = res.files[key].name.substring(index);
            notasOrdenadas.push(parseInt(name.split(/\D+/).join(''), 10));
          }
        });
        setNotas(notasOrdenadas.sort());
      }
    });
  };

  const setInfoAno = () => {
    setInformarAno(!informarAno);
  };

  const changeAnoInformado = (ano) => {
    setAnoInformado(+ano.target.value);
  };

  const notasOrdenadasGestorFmt = () => {
    const linhas = infoGestor.split('\n');
    const notasGestorOrdenadas = [];
    const anoParaUsar = informarAno ? anoInformado : anoAtual;
    linhas.forEach((it) => {
      notasGestorOrdenadas.push(
        +it.substring(it.indexOf(anoParaUsar) + 4, it.indexOf('valor') - 2)
      );
    });
    return notasGestorOrdenadas;
  };

  const traduzirInfoGestor = () => {
    const notasGestorOrdenadas = notasOrdenadasGestorFmt();
    verificarNotasPresentesGestor(notasGestorOrdenadas);
    verificarNotasPresentesZip(notasGestorOrdenadas);
    setNotasGestor(notasGestorOrdenadas);
    setShowResult(true);
  };

  const verificarNotasPresentesGestor = (notasGestorOrdenadas) => {
    const result = [];
    notasGestorOrdenadas.forEach((it) => {
      const nota = notas.find((nota) => nota === it);
      if (isNaN(nota)) {
        result.push(it);
      }
    });
    setNotasPresentesGestor(result);
  };

  const verificarNotasPresentesZip = (notasGestorOrdenadas) => {
    const result = [];
    notas.forEach((it) => {
      const nota = notasGestorOrdenadas.find((nota) => nota === it);
      if (isNaN(nota)) {
        result.push(it);
      }
    });
    setNotasPresentesZip(result);
  };

  const lerArquivoPrefeitura = (compararComGestor) => {
    setLoading(true);
    let infosGestor;
    if (compararComGestor) {
      infosGestor = notasOrdenadasGestorFmt();
    }
    const mapNotas = new Map();
    const reader = new FileReader();
    let soma = 0;
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      jsonData.forEach((nota) => {
        const numeroNota = nota['Número da Nota'];
        const descriminacaoNota = nota['Discriminação dos Serviços'];
        const valorNota = nota['Valor da Nota'];
        const numeroNotaFmt = +formatarNumeroNota(numeroNota);
        if (
          infosGestor &&
          infosGestor.includes(numeroNotaFmt) &&
          !descriminacaoNota.includes('NITRUS')
        ) {
          mapNotas.set(numeroNotaFmt, descriminacaoNota.substring(0, 27));
        }

        if (descriminacaoNota.includes('CLUBE ELITE')) {
          soma += parseBRL(valorNota);
        }
      });
      if (compararComGestor) {
        setMapNotasPref(mapNotas);
        setShowResultPref(mapNotas && mapNotas.size > 0);
        setShowResultPrefSemNotas(mapNotas && mapNotas.size === 0);
      }

      setResultSum(formatBRL.format(soma));
      setShowResultSum(true);
      setLoading(false);
    };
    reader.readAsArrayBuffer(pathPrefeitura);
  };

  function formatarNumeroNota(num) {
    const regex = /^20\d{2}0*(\d+)$/;
    const match = String(num).match(regex);
    return match ? Number(match[1]) : '"';
  }

  const somarNotas = () => lerArquivoPrefeitura(false);

  const parseBRL = (value) => {
    return Number(value.replace(/\./g, '').replace(',', '.'));
  };

  const limparCampos = () => {
    setInfoGestor('');
    setArquivoPrefeitura();
    fileRef.current.value = null;
    setShowResultPref(false);
    setShowResultPrefSemNotas(false);
    setShowResultSum(false);
  };

  const getModal = () => {
    return (
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle}>
          Notas ordenadas / Total: {notas ? notas.length : 0}
        </ModalHeader>
        <ModalBody>
          <div
            style={{
              textAlign: 'center',
              overflowY: 'auto',
              height: '450'
            }}
          >
            {notas &&
              notas.map((it) => (
                <>
                  {notas.find((num) => num === it) - 1 !== +notas.find((num) => +num === it - 1) &&
                    notas.find((num) => num === it) !== notas[0] && (
                      <h6 style={{ color: 'red', textAlign: 'center' }}>
                        ========== QUEBRA DE SEQUÊNCIA ==========
                      </h6>
                    )}
                  <span>{it}</span>
                  <br />
                </>
              ))}
          </div>
        </ModalBody>
      </Modal>
    );
  };

  const getModalComparacao = () => {
    return (
      <Modal isOpen={modalComparacao} toggle={toggleComparacao}>
        <ModalHeader toggle={toggleComparacao}>Informações</ModalHeader>
        <ModalBody>
          <UncontrolledAccordion defaultOpen={['1', '2']} stayOpen>
            <AccordionItem>
              <AccordionHeader targetId="1">Informações do Gestor</AccordionHeader>
              <AccordionBody accordionId="1">
                <div style={{ textAlign: 'center' }}>
                  <Label for="infosGestor">Informações do gestor</Label>
                  <Input
                    id="infosGestor"
                    name="text"
                    type="textarea"
                    onChange={(info) => setInfoGestor(info.target.value)}
                  />
                  <div
                    style={{
                      color: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      marginTop: '10px'
                    }}
                  >
                    <label for="inputFile" className="inputFile">
                      Importar arquivo
                    </label>
                    <input
                      type="file"
                      id="inputFile"
                      onChange={setZip}
                      className="hidden"
                      textContent="teste"
                      name="inputFile"
                      accept=".zip"
                    />
                    {fileName && (
                      <p style={{ color: 'black' }}>Arquivo escolhido: {fileName + '.zip'}</p>
                    )}
                    <Button
                      onClick={toggle}
                      color="success"
                      outline={!path}
                      disabled={!path}
                      style={{ marginBottom: 5, cursor: 'pointer' }}
                    >
                      Listar número das notas ordenadas
                    </Button>
                  </div>
                  <Button
                    onClick={traduzirInfoGestor}
                    color="primary"
                    style={{ cursor: 'pointer', marginTop: 5 }}
                    disabled={!infoGestor}
                  >
                    Comparar
                  </Button>
                </div>
              </AccordionBody>
            </AccordionItem>
            <AccordionItem disabled={true}>
              <AccordionHeader targetId="2">Resultado do "Comparar"</AccordionHeader>
              <AccordionBody accordionId="2">
                {!showResult ? (
                  'Preencha o campo acima para vizualizar os resultados!'
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <h6>Total de notas do gestor: {notasGestor && notasGestor.length}</h6>
                    <h6>
                      Notas presentes no Gestor e não no ZIP:{' '}
                      {notasPresentesGestor && notasPresentesGestor.length === 0
                        ? 'Nenhuma'
                        : notasPresentesGestor.map((it) => it + ', ')}
                    </h6>
                    <br />
                    <h6>Total de notas do ZIP: {notas && notas.length}</h6>
                    <h6>
                      Notas presentes no ZIP e não no Gestor:{' '}
                      {notasPresentesZip && notasPresentesZip.length === 0
                        ? 'Nenhuma'
                        : notasPresentesZip.map((it) => it + ', ')}
                    </h6>
                  </div>
                )}
              </AccordionBody>
            </AccordionItem>
          </UncontrolledAccordion>
        </ModalBody>
      </Modal>
    );
  };

  const getModalComparacaoPrefeitura = () => {
    return (
      <Modal isOpen={modalComparacaoPrefeitura} toggle={toggleComparacaoPrefeitura}>
        <ModalHeader toggle={toggleComparacaoPrefeitura}>
          Comparar com informações da prefeitura
        </ModalHeader>
        <ModalBody>
          <UncontrolledAccordion defaultOpen={['1', '2', '3']} stayOpen>
            <AccordionItem>
              <AccordionHeader targetId="1">Informações do Gestor</AccordionHeader>
              <AccordionBody accordionId="1">
                <div style={{ textAlign: 'center' }}>
                  <Label for="infosGestor">Informações do gestor</Label>
                  <Input
                    id="infosGestor"
                    name="text"
                    type="textarea"
                    value={infoGestor}
                    onChange={(info) => setInfoGestor(info.target.value)}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    color: 'white',
                    marginTop: '20px'
                  }}
                >
                  <label for="inputFilePref" className="inputFile">
                    Importart xls da prefeitura
                  </label>
                  <input
                    type="file"
                    id="inputFilePref"
                    onChange={setArquivoPrefeitura}
                    className="hidden"
                    textContent="teste"
                    name="inputFile"
                    accept=".xls, .xlsx"
                    ref={fileRef}
                  />
                  {fileNamePref && (
                    <p style={{ color: 'black' }}>Arquivo escolhido: {fileNamePref + '.xls'}</p>
                  )}
                  <Button
                    onClick={() => lerArquivoPrefeitura(true)}
                    color="primary"
                    style={{ cursor: 'pointer', marginTop: 5 }}
                    disabled={!pathPrefeitura || !infoGestor}
                  >
                    Verificar notas da prefeitura
                  </Button>
                  <Button
                    onClick={somarNotas}
                    color="primary"
                    style={{ cursor: 'pointer', marginTop: 5 }}
                    disabled={!pathPrefeitura}
                  >
                    Somar notas Clube Elite
                  </Button>
                  <Button
                    onClick={limparCampos}
                    color="danger"
                    style={{ cursor: 'pointer', marginTop: 5 }}
                  >
                    Limpar campos
                  </Button>
                </div>
              </AccordionBody>
            </AccordionItem>
            <AccordionItem disabled={true} isOpen={true}>
              <AccordionHeader targetId="2">
                Resultado do "Verificar notas prefeitura"
              </AccordionHeader>
              <AccordionBody accordionId="2">
                {loading ? (
                  <div style={{ textAlign: 'center' }}>
                    <Spinner color="primary" />
                  </div>
                ) : (
                  <>
                    {!showResultPref && !showResultPrefSemNotas ? (
                      'Preencha os campos para vizualizar os resultados!'
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <>
                          {!showResultPrefSemNotas && (
                            <p>
                              Notas sem descrição NITRUS:{' '}
                              {Array.from(mapNotasPref).map(([key, value]) => (
                                <p key={key}>
                                  {key}: {value}
                                </p>
                              ))}
                            </p>
                          )}
                        </>
                      </div>
                    )}
                  </>
                )}
                {showResultPrefSemNotas && 'Não foram encontradas notas do Calima!'}
              </AccordionBody>
            </AccordionItem>
            <AccordionItem disabled={true} isOpen={true}>
              <AccordionHeader targetId="3">Resultado do "Somar notas Clube Elite"</AccordionHeader>
              <AccordionBody accordionId="3">
                {loading ? (
                  <div style={{ textAlign: 'center' }}>
                    <Spinner color="primary" />
                  </div>
                ) : (
                  <>
                    {!showResultSum ? (
                      'Informe o arquivo para vizualizar os resultados!'
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <p>Soma do valor das notas Clube Elite: {resultSum}</p>
                      </div>
                    )}
                  </>
                )}
              </AccordionBody>
            </AccordionItem>
          </UncontrolledAccordion>
        </ModalBody>
      </Modal>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <FormGroup switch>
            <Input type="switch" onClick={setInfoAno} id="switch1" />
            <Label switch={'switch1'}>Informar ano</Label>
            {informarAno && (
              <Input
                id="exampleSelect"
                name="select"
                type="select"
                disabled={!informarAno}
                style={!informarAno ? styleDisabled : {}}
                onBlur={changeAnoInformado}
              >
                {anos.map((it) => {
                  return it === anoAtual ? <option selected>{it}</option> : <option>{it}</option>;
                })}
              </Input>
            )}
            <br />
          </FormGroup>
        </div>
        <Button
          onClick={toggleComparacao}
          color="danger"
          style={{ marginBottom: 5, cursor: 'pointer' }}
        >
          Comparar ZIP do gestor (Início do mês)
        </Button>
        <Button
          onClick={toggleComparacaoPrefeitura}
          color="info"
          style={{ marginBottom: 5, cursor: 'pointer' }}
        >
          Comparar XLS da prefeitura (Meio do mês)
        </Button>
        {getModal()}
        {getModalComparacao()}
        {getModalComparacaoPrefeitura()}
      </header>
    </div>
  );
}

export default App;
