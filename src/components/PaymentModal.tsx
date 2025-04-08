"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Box,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Stack,
  VStack,
  Table,
  Tbody,
  Tr,
  Td,
  Heading,
  InputGroup,
  InputRightElement,
  Icon,
  Flex,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaPhoneAlt, FaInfoCircle } from "react-icons/fa";
import { requestPaymentByPhone } from "../api/payment";
import { useTheme } from "../context/ThemeContext";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  recipientName: string;
  onPaymentSuccess?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  recipientName,
  onPaymentSuccess,
}) => {
  // Dane płatnika
  const [payerPhone, setPayerPhone] = useState("");
  const [payerName, setPayerName] = useState("");
  const { darkMode } = useTheme();

  // Stan formularza
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [nameError, setNameError] = useState("");

  // Inne stany
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const toast = useToast();

  // Kolory z uwzględnieniem trybu ciemnego
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");
  const summaryBgColor = useColorModeValue("gray.50", "gray.700");
  const infoBgColor = useColorModeValue("blue.50", "blue.900");
  const infoIconColor = useColorModeValue("blue.500", "blue.300");
  const receiptBgColor = useColorModeValue("green.50", "green.900");
  const receiptTextColor = useColorModeValue("green.600", "green.200");

  // Resetowanie stanu przy otwarciu/zamknięciu modalu
  useEffect(() => {
    if (isOpen) {
      setIsModalOpen(true);
      setShowReceipt(false);
      setPayerPhone("");
      setPayerName("");
      setPhoneError("");
      setNameError("");
    } else {
      setIsModalOpen(false);
    }
  }, [isOpen]);

  // Walidacja danych
  const validateInputs = () => {
    let isValid = true;

    // Walidacja numeru telefonu
    if (!payerPhone.trim()) {
      setPhoneError("Wprowadź numer telefonu");
      isValid = false;
    } else if (!/^\d{9}$/.test(payerPhone.trim())) {
      setPhoneError("Wprowadź poprawny 9-cyfrowy numer telefonu");
      isValid = false;
    } else {
      setPhoneError("");
    }

    // Walidacja imienia i nazwiska
    if (!payerName.trim()) {
      setNameError("Wprowadź imię i nazwisko");
      isValid = false;
    } else if (payerName.trim().length < 3) {
      setNameError("Imię i nazwisko musi mieć co najmniej 3 znaki");
      isValid = false;
    } else {
      setNameError("");
    }

    return isValid;
  };

  // Obsługa płatności przez BLIK na telefon
  const handlePhonePayment = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);

    try {
      // Generowanie opisu płatności
      const description = `Płatność dla ${recipientName}`;

      // Wysłanie prośby o płatność na numer telefonu
      const success = await requestPaymentByPhone(
        payerPhone,
        amount,
        description
      );

      if (success) {
        setTransactionId(`BLIK${Date.now().toString().slice(-6)}`);
        setShowReceipt(true);

        toast({
          title: "Prośba o płatność wysłana",
          description:
            "Sprawdź swoją aplikację bankową i zatwierdź płatność BLIK",
          status: "success",
          duration: 9000,
          isClosable: true,
          position: "top",
        });

        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else {
        toast({
          title: "Błąd płatności",
          description:
            "Nie udało się wysłać prośby o płatność. Spróbuj ponownie",
          status: "error",
          duration: 9000,
          isClosable: true,
          position: "top",
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Wystąpił błąd",
        description: "Nie udało się przetworzyć płatności. Spróbuj ponownie",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace(".", ",") + " zł";
  };

  const handleModalClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isModalOpen} onClose={handleModalClose} size="md">
      <ModalOverlay />
      <ModalContent bg={bgColor} borderColor={borderColor}>
        <ModalHeader color={textColor}>
          Płatność BLIK
          <Text fontSize="sm" color={secondaryTextColor} mt={1}>
            Szybka płatność przez telefon
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {!showReceipt ? (
            <Stack spacing={5}>
              {/* Tabela z podsumowaniem płatności */}
              <Box
                borderWidth="1px"
                borderRadius="lg"
                p={4}
                bg={summaryBgColor}
                borderColor={borderColor}
              >
                <Table variant="simple" size="sm">
                  <Tbody>
                    <Tr>
                      <Td p={2} fontWeight="medium" color={textColor}>
                        Odbiorca:
                      </Td>
                      <Td p={2} isNumeric color={textColor}>
                        {recipientName}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td p={2} fontWeight="medium" color={textColor}>
                        Kwota:
                      </Td>
                      <Td p={2} fontWeight="bold" isNumeric color={textColor}>
                        {formatCurrency(amount)}
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>

                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-400 mb-2">
                    Popularne aplikacje bankowe:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <a
                      href="https://www.pkobp.pl/iko"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 border border-gray-600 rounded hover:bg-gray-700"
                    >
                      PKO BP
                    </a>
                    <a
                      href="https://www.mbank.pl/aplikacja"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 border border-gray-600 rounded hover:bg-gray-700"
                    >
                      mBank
                    </a>
                    <a
                      href="https://www.santander.pl/aplikacja-mobilna"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 border border-gray-600 rounded hover:bg-gray-700"
                    >
                      Santander
                    </a>
                    <a
                      href="https://www.ing.pl/aplikacja-mobilna-ing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 border border-gray-600 rounded hover:bg-gray-700"
                    >
                      ING
                    </a>
                    <a
                      href="https://www.pekao.com.pl/aplikacja-peopay"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 border border-gray-600 rounded hover:bg-gray-700"
                    >
                      Pekao
                    </a>
                  </div>
                </div>
              </Box>

              {/* Formularz danych płatnika */}
              <VStack spacing={4}>
                <FormControl isInvalid={!!nameError}>
                  <FormLabel color={textColor}>Imię i nazwisko</FormLabel>
                  <Input
                    placeholder="Jan Kowalski"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    isDisabled={isLoading}
                    borderColor={borderColor}
                    _hover={{ borderColor: darkMode ? "blue.500" : "blue.300" }}
                    _focus={{ borderColor: "blue.500" }}
                  />
                  {nameError && (
                    <FormErrorMessage>{nameError}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={!!phoneError}>
                  <FormLabel color={textColor}>Numer telefonu</FormLabel>
                  <InputGroup>
                    <Input
                      type="tel"
                      placeholder="Np. 501234567"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      isDisabled={isLoading}
                      borderColor={borderColor}
                      _hover={{
                        borderColor: darkMode ? "blue.500" : "blue.300",
                      }}
                      _focus={{ borderColor: "blue.500" }}
                    />
                    <InputRightElement>
                      <Icon as={FaPhoneAlt} color={secondaryTextColor} />
                    </InputRightElement>
                  </InputGroup>
                  {phoneError && (
                    <FormErrorMessage>{phoneError}</FormErrorMessage>
                  )}
                </FormControl>
              </VStack>

              {/* Instrukcja BLIK */}
              <Box
                p={3}
                borderRadius="md"
                bg={infoBgColor}
                borderColor={borderColor}
              >
                <Flex alignItems="flex-start">
                  <Icon as={FaInfoCircle} mr={2} mt={1} color={infoIconColor} />
                  <Text fontSize="sm" color={textColor}>
                    Po kliknięciu "Zapłać" wyślemy prośbę o płatność na podany
                    numer. Zatwierdź płatność w swojej aplikacji bankowej.
                  </Text>
                </Flex>
              </Box>
            </Stack>
          ) : (
            <VStack spacing={4} align="stretch">
              <Box
                borderWidth="1px"
                borderRadius="lg"
                p={5}
                bg={receiptBgColor}
                borderColor={borderColor}
                textAlign="center"
              >
                <Heading size="md" mb={3} color={receiptTextColor}>
                  Prośba wysłana!
                </Heading>
                <Text color={textColor}>
                  Sprawdź swoją aplikację bankową i zatwierdź płatność BLIK.
                </Text>
                <Text fontSize="sm" mt={3} color={secondaryTextColor}>
                  Nr ref: {transactionId}
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" color={textColor}>
                  1. Otwórz aplikację swojego banku
                </Text>
                <Text fontSize="sm" color={textColor}>
                  2. Zatwierdź płatność BLIK
                </Text>
              </Box>

              <div className="mt-4">
                <p className="text-sm font-medium mb-2">
                  Popularne aplikacje bankowe:
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://www.pkobp.pl/iko"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-3 py-1.5 border border-gray-600 rounded hover:bg-gray-700"
                  >
                    PKO BP
                  </a>
                  <a
                    href="https://www.mbank.pl/aplikacja"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-3 py-1.5 border border-gray-600 rounded hover:bg-gray-700"
                  >
                    mBank
                  </a>
                  <a
                    href="https://www.santander.pl/aplikacja-mobilna"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-3 py-1.5 border border-gray-600 rounded hover:bg-gray-700"
                  >
                    Santander
                  </a>
                  <a
                    href="https://www.ing.pl/aplikacja-mobilna-ing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-3 py-1.5 border border-gray-600 rounded hover:bg-gray-700"
                  >
                    ING
                  </a>
                  <a
                    href="https://www.pekao.com.pl/aplikacja-peopay"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-3 py-1.5 border border-gray-600 rounded hover:bg-gray-700"
                  >
                    Pekao
                  </a>
                </div>
              </div>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter flexDirection="column" alignItems="stretch">
          {!showReceipt ? (
            <Button
              colorScheme="blue"
              size="lg"
              isLoading={isLoading}
              loadingText="Przetwarzanie..."
              onClick={handlePhonePayment}
              leftIcon={<FaPhoneAlt />}
              w="100%"
            >
              Zapłać BLIK-iem
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleModalClose}
              w="100%"
              borderColor={borderColor}
            >
              Zamknij
            </Button>
          )}
          <Text
            fontSize="xs"
            textAlign="center"
            mt={3}
            color={secondaryTextColor}
          >
            Wersja demonstracyjna. Brak rzeczywistej integracji z bankiem.
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal;
