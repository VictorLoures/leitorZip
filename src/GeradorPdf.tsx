import { Document, Page, Text, StyleSheet, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 70,
    paddingHorizontal: 10
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: '#eee'
  },
  title: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold'
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1px solid #ccc'
  },
  col: {
    width: '25%',
    padding: 5,
    fontSize: 10
  },
  headerRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000'
  }
});

export const doc = (data: any) =>
  new Promise((resolve) => {
    resolve(
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.headerContainer} fixed>
            <Text
              style={styles.title}
              render={({ pageNumber }) => (pageNumber === 1 ? 'Relação de pagamentos' : '')}
            />
            <View style={styles.headerRow}>
              <Text style={styles.col}>Dt. vencimento</Text>
              <Text style={styles.col}>Dt. efetivação</Text>
              <Text style={styles.col}>Valor original</Text>
              <Text style={styles.col}>Valor efetivado</Text>
            </View>
          </View>

          {/* DADOS */}
          {data.map((item: any, index: any) => (
            <View style={styles.row} key={index}>
              <Text style={styles.col}>{item[2]}</Text>
              <Text style={styles.col}>{item[3]}</Text>
              <Text style={styles.col}>{item[6]}</Text>
              <Text style={styles.col}>{item[7]}</Text>
            </View>
          ))}
        </Page>
      </Document>
    );
  });
