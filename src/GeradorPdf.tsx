import { Document, Page, Text, StyleSheet, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottom: '1px solid #ccc'
  },
  col: {
    width: '25%',
    padding: 5
  },
  header: {
    backgroundColor: '#eee',
    fontWeight: 'bold'
  }
});

export const doc = (data: any) =>
  new Promise((resolve) => {
    resolve(
      <Document>
        <Page size="A4">
          <View style={[styles.row, styles.header]} fixed>
            <Text style={styles.col}>Dt. vencimento</Text>
            <Text style={styles.col}>Dt. efetivação</Text>
            <Text style={styles.col}>Valor original</Text>
            <Text style={styles.col}>Valor efetivado</Text>
          </View>

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
