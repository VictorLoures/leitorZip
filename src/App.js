import "./App.css";
import JSZip, { file } from "jszip";
import download from "js-file-download";
import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  UncontrolledAccordion,
  Accordion,
  AccordionBody,
  AccordionHeader,
  AccordionItem,
  Button,
  FormGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  Input,
} from "reactstrap";
import { anos } from "./files/enums";

const anoAtual = new Date().getFullYear();

const styleDisabled = {
  backgroundColor: "gray",
  borderColor: "gray",
};

function App() {
  const [path, setPath] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [informarAno, setInformarAno] = useState(false);
  const [anoInformado, setAnoInformado] = useState(null);
  const [infoGestor, setInfoGestor] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [notasPresentesGestor, setNotasPresentesGestor] = useState(null);
  const [notasPresentesZip, setNotasPresentesZip] = useState(null);

  const [modal, setModal] = useState(false);
  const [notas, setNotas] = useState(null);
  const toggle = () => {
    if (!modal) {
      listarNotas();
    }
    setModal(!modal);
  };

  const [modalComparacao, setModalComparacao] = useState(false);
  const [notasGestor, setNotasGestor] = useState(null);
  const toggleComparacao = () => {
    if (!modalComparacao) {
      listarNotas();
    } else {
      setInfoGestor(null);
      setShowResult(false);
      setNotasPresentesGestor(null);
      setNotasPresentesZip(null);
    }
    setModalComparacao(!modalComparacao);
  };

  const downloadZip = (zip, name) => {
    zip.generateAsync({ type: "blob" }).then((blobdata) => {
      const zipblob = new Blob([blobdata]);
      download(zipblob, name);
      setTimeout(() => window.location.reload(true), 500);
    });
  };

  const setZip = (file) => {
    setPath(file.target.files[0]);
    const name = file.target.value;
    setFileName(name.substring(name.lastIndexOf("\\") + 1, name.indexOf(".")));
  };

  const downloadZipRenomeado = () => {
    const zip = JSZip();
    const zipDownload = JSZip();
    zip.loadAsync(path).then(function (res) {
      if (res.files) {
        const keys = Object.keys(res.files);
        zipDownload.files = {};
        keys.map((key) => {
          const anoParaUsar = informarAno ? anoInformado : anoAtual;
          const index = res.files[key].name.lastIndexOf(anoParaUsar) + 4;
          const name = res.files[key].name.substring(index);

          //inclui o arquivo novo
          res.files[key].name = name;
          zipDownload.files[res.files[key].name] = res.files[key];
        });
        downloadZip(zipDownload, fileName + "Renomeado.zip");
        document.getElementById("inputFile").value = "";
      }
    });
  };

  const listarNotas = () => {
    const zip = JSZip();
    zip.loadAsync(path).then(function (res) {
      if (res.files) {
        const keys = Object.keys(res.files);
        const notasOrdenadas = [];
        const anoParaUsar = informarAno ? anoInformado : anoAtual;
        keys.map((key) => {
          if (key.includes(".xml")) {
            const index = res.files[key].name.lastIndexOf(anoParaUsar) + 4;
            const name = res.files[key].name.substring(index);
            //inclui o arquivo novo
            notasOrdenadas.push(parseInt(name.split(/\D+/).join(""), 10));
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

  const traduzirInfoGestor = () => {
    const linhas = infoGestor.split("\n");
    const notasGestorOrdenadas = [];
    const anoParaUsar = informarAno ? anoInformado : anoAtual;
    linhas.forEach((it) => {
      notasGestorOrdenadas.push(
        +it.substring(it.indexOf(anoParaUsar) + 4, it.indexOf("valor") - 2)
      );
    });
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

  const getModal = () => {
    return (
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle}>
          Notas ordenadas / Total: {notas ? notas.length : 0}
        </ModalHeader>
        <ModalBody>
          <div style={{ textAlign: "center", overflow: "auto", height: "450" }}>
            {notas &&
              notas.map((it) => (
                <>
                  {notas.find((num) => num === it) - 1 !==
                    +notas.find((num) => +num === it - 1) &&
                    notas.find((num) => num === it) !== notas[0] && (
                      <h6 style={{ color: "red", textAlign: "center" }}>
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
          <UncontrolledAccordion defaultOpen={["1", "2"]} stayOpen>
            <AccordionItem>
              <AccordionHeader targetId="1">
                Informações do Gestor
              </AccordionHeader>
              <AccordionBody accordionId="1">
                <div style={{ textAlign: "center" }}>
                  <Label for="exampleText">Informações do gestor</Label>
                  <Input
                    id="exampleText"
                    name="text"
                    type="textarea"
                    onChange={(info) => setInfoGestor(info.target.value)}
                  />
                  <Button
                    onClick={traduzirInfoGestor}
                    color="primary"
                    style={{ cursor: "pointer", marginTop: 5 }}
                    disabled={!infoGestor}
                  >
                    Comparar
                  </Button>
                </div>
              </AccordionBody>
            </AccordionItem>
            <AccordionItem disabled={true}>
              <AccordionHeader targetId="2">Resultado</AccordionHeader>
              <AccordionBody accordionId="2">
                {!showResult ? (
                  "Preencha o campo acima para vizualizar os resultados!"
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <h6>
                      Total de notas do gestor:{" "}
                      {notasGestor && notasGestor.length}
                    </h6>
                    <h6>
                      Notas presentes no Gestor e não no ZIP:{" "}
                      {notasPresentesGestor && notasPresentesGestor.length === 0
                        ? "Nenhuma"
                        : notasPresentesGestor.map((it) => it + ", ")}
                    </h6>
                    <br />
                    <h6>Total de notas do ZIP: {notas && notas.length}</h6>
                    <h6>
                      Notas presentes no ZIP e não no Gestor:{" "}
                      {notasPresentesZip && notasPresentesZip.length === 0
                        ? "Nenhuma"
                        : notasPresentesZip.map((it) => it + ", ")}
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

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <FormGroup switch>
            <Input type="switch" onClick={setInfoAno} id="switch1" />
            <Label switch={"switch1"}>Informar ano</Label>
            <Input
              id="exampleSelect"
              name="select"
              type="select"
              disabled={!informarAno}
              style={!informarAno ? styleDisabled : {}}
              onBlur={changeAnoInformado}
            >
              {anos.map((it) => {
                return it === anoAtual ? (
                  <option selected>{it}</option>
                ) : (
                  <option>{it}</option>
                );
              })}
            </Input>
            <br />
            <br />
          </FormGroup>
        </div>
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
        {fileName && <p>Arquivo escolhido: {fileName + ".zip"}</p>}
        <br />
        <Button
          onClick={toggleComparacao}
          color="danger"
          outline={!path}
          disabled={!path}
          style={{ marginBottom: 5, cursor: "pointer" }}
        >
          Comparação XML
        </Button>
        <Button
          onClick={toggle}
          color="success"
          outline={!path}
          disabled={!path}
          style={{ marginBottom: 5, cursor: "pointer" }}
        >
          Listar número das notas ordenadas
        </Button>
        <Button
          onClick={downloadZipRenomeado}
          color="primary"
          outline={!path}
          disabled={!path}
          style={{ cursor: "pointer" }}
        >
          Baixar ZIP renomeado
        </Button>
        {getModal()}
        {getModalComparacao()}
      </header>
    </div>
  );
}

export default App;
