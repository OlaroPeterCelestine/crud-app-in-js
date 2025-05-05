import React, { useEffect, useState } from "react";
import { View, FlatList, Alert, StyleSheet, ScrollView } from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider as PaperProvider, Text, TextInput, Button, Card, Menu } from "react-native-paper";

const Stack = createNativeStackNavigator();

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.centeredView}>
      <Button mode="contained" onPress={() => navigation.navigate("NewSale")} style={styles.button}>New Sale</Button>
      <Button mode="contained" style={[styles.button, styles.marginTop]} onPress={() => navigation.navigate("Sales")}>Sales History</Button>
    </View>
  );
};

const NewSaleScreen = ({ navigation }) => {
  const [product, setProduct] = useState("");
  const [price, setPrice] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [defaultProducts] = useState([
    { name: "Laptop", price: 1000 },
    { name: "Phone", price: 500 },
    { name: "Tablet", price: 300 },
    { name: "Headphones", price: 150 },
  ]);
  const [showMenu, setShowMenu] = useState(false);

  const incrementQuantity = () => setQuantity((prevQuantity) => prevQuantity + 1);
  const decrementQuantity = () => {
    if (quantity > 1) setQuantity((prevQuantity) => prevQuantity - 1); // Prevent going below 1
  };

  const saveSale = async () => {
    if (!product || !price || quantity < 1) return Alert.alert("Error", "Please fill in all fields");

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Location permission is required");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});

    const sale = {
      id: Date.now().toString(),
      product,
      price,
      quantity,
      totalPrice: price * quantity,  // Calculate total price for this sale
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      },
      timestamp: new Date().toISOString()
    };

    const existing = JSON.parse(await AsyncStorage.getItem("sales")) || [];
    await AsyncStorage.setItem("sales", JSON.stringify([sale, ...existing]));

    Alert.alert("Success", "Sale recorded!");
    setProduct("");
    setPrice(null);
    setQuantity(1); // Reset quantity to 1 after saving
    navigation.goBack();
  };

  const handleProductSelect = (selectedProduct) => {
    setProduct(selectedProduct.name);
    setPrice(selectedProduct.price);
    setShowMenu(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Record New Sale</Text>
      <Menu
        visible={showMenu}
        onDismiss={() => setShowMenu(false)}
        anchor={<Button mode="outlined" onPress={() => setShowMenu(true)}>{product || "Select Product"}</Button>}
      >
        {defaultProducts.map((item, index) => (
          <Menu.Item key={index} onPress={() => handleProductSelect(item)} title={item.name} />
        ))}
      </Menu>

      {/* Price is automatically filled based on selected product */}
      {price && <TextInput label="Price (UGX)" value={`UGX ${price}`} editable={false} style={styles.input} />}

      {/* Quantity Increment/Decrement */}
      <View style={styles.quantityContainer}>
        <Button onPress={decrementQuantity} mode="outlined" style={styles.quantityButton}>-</Button>
        <Text style={styles.quantityText}>{quantity}</Text>
        <Button onPress={incrementQuantity} mode="outlined" style={styles.quantityButton}>+</Button>
      </View>

      <Button mode="contained" onPress={saveSale} style={styles.button}>Save Sale</Button>
    </ScrollView>
  );
};

const SalesScreen = () => {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const fetchSales = async () => {
      const data = JSON.parse(await AsyncStorage.getItem("sales")) || [];
      setSales(data);
    };
    fetchSales();
  }, []);

  return (
    <View style={styles.salesContainer}>
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.productTitle}>{item.product}</Text>
              <Text style={styles.priceText}>UGX {item.totalPrice}</Text>

              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailTitle}>Quantity:</Text>
                  <Text style={styles.detailText}>{item.quantity}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailTitle}>Price per Item:</Text>
                  <Text style={styles.detailText}>UGX {item.price}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailTitle}>Location:</Text>
                  <Text style={styles.detailText}>
                    Lat: {item.location.latitude.toFixed(4)}, Lon: {item.location.longitude.toFixed(4)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailTitle}>Date:</Text>
                  <Text style={styles.detailText}>{new Date(item.timestamp).toLocaleString()}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Welcome" }} />
          <Stack.Screen name="NewSale" component={NewSaleScreen} options={{ title: "New Sale" }} />
          <Stack.Screen name="Sales" component={SalesScreen} options={{ title: "Sales History" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    width: '80%',
    marginBottom: 10,
  },
  marginTop: {
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 20,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityButton: {
    width: 50,
    height: 50,
    marginHorizontal: 10,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  salesContainer: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    padding: 15,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 8,
    elevation: 3,
  },
  cardContent: {
    padding: 15,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  priceText: {
    fontSize: 18,
    color: "#4caf50", // Green color for price
    marginVertical: 10,
  },
  detailsContainer: {
    marginTop: 10,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  detailTitle: {
    fontSize: 14,
    color: "#888", // Lighter color for titles
    fontWeight: "600",
  },
  detailText: {
    fontSize: 14,
    color: "#333", // Darker color for text
  },
  separator: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
});
