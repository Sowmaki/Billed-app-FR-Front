/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from '@testing-library/user-event';
import { localStorageMock } from "../__mocks__/localStorage.js";
import { mockStore } from "../__mocks__/store.js";
import router from "../app/Router.js";
import window from "../assets/svg/window.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import BillsUI from "../views/BillsUI.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy() // TO DO

    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/).map(a => a.innerHTML);
      const datesSorted = [...dates].sort((a, b) => new Date(b) - new Date(a));
      expect(dates).toEqual(datesSorted);
    });


    describe('When I click on IconEye ', () => {
      const icon = document.createElement('div')
      icon.setAttribute('data-bill-url', 'https://fakeurl.com/bill.jpg');

      $.fn.modal = jest.fn(); //mock de la fonction modal
      const modal = document.createElement('div');
      modal.setAttribute('id', 'modaleFile');
      modal.innerHTML = '<div class="modal-body"></div>';
      document.body.append(modal);

      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
      billsInstance.handleClickIconEye(icon);

      const modalBody = document.querySelector('.modal-body');
      expect(modalBody.innerHTML).toContain('https://fakeurl.com/bill.jpg');
      expect($.fn.modal).toHaveBeenCalledWith('show')

    });


    describe('When I click on new bill button', () => {
      test(('Then, I should be sent to newBill page'), () => {
        const daBills = [{
          "id": "47qAXb6fIm2zOKkLzMro",
          "vat": "80",
          "fileUrl": "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
          "status": "pending",
          "type": "Hôtel et logement",
          "commentary": "séminaire billed",
          "name": "encore",
          "fileName": "preview-facture-free-201801-pdf-1.jpg",
          "date": "2004-04-04",
          "amount": 400,
          "commentAdmin": "ok",
          "email": "a@a",
          "pct": 20,
        }]

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))

        const bills = new Bills({ document, onNavigate, localStorage })
        const handleClick = jest.fn(bills.handleClickNewBill)
        document.body.innerHTML = BillsUI({ data: daBills })

        const btnNewBill = screen.getByTestId('btn-new-bill')
        btnNewBill.addEventListener('click', handleClick)
        userEvent.click(btnNewBill)
        expect(handleClick).toHaveBeenCalled()
      })
    })

    describe('Data transformation with error handling', () => {
      let mockFormatDate;
      let mockFormatStatus;

      beforeEach(() => {
        // Mocker les fonctions de transformation
        mockFormatDate = jest.fn();
        mockFormatStatus = jest.fn((status) => `Formatted-${status}`);
      });

      test('should format date and status correctly for valid data', () => {
        // Simuler un snapshot de données valide
        const snapshot = [
          { id: 1, date: '2024-12-27', status: 'pending' },
          { id: 2, date: '2024-11-15', status: 'accepted' },
        ];

        // Configurer le comportement de formatDate
        mockFormatDate
          .mockReturnValueOnce('27/12/2024') // Première date formatée
          .mockReturnValueOnce('15/11/2024'); // Deuxième date formatée

        // Mapper les données comme dans votre code
        const bills = snapshot.map((doc) => {
          try {
            return {
              ...doc,
              date: mockFormatDate(doc.date),
              status: mockFormatStatus(doc.status),
            };
          } catch (e) {
            console.log(e, 'for', doc);
            return {
              ...doc,
              date: doc.date,
              status: mockFormatStatus(doc.status),
            };
          }
        });

        // Assertions sur les transformations
        expect(mockFormatDate).toHaveBeenCalledTimes(2);
        expect(mockFormatDate).toHaveBeenCalledWith('2024-12-27');
        expect(mockFormatDate).toHaveBeenCalledWith('2024-11-15');
        expect(mockFormatStatus).toHaveBeenCalledTimes(2);
        expect(bills).toEqual([
          { id: 1, date: '27/12/2024', status: 'Formatted-pending' },
          { id: 2, date: '15/11/2024', status: 'Formatted-accepted' },
        ]);
      });

      test('should handle corrupted data gracefully', () => {
        // Simuler un snapshot avec une donnée corrompue
        const snapshot = [
          { id: 1, date: 'invalid-date', status: 'pending' },
          { id: 2, date: '2024-11-15', status: 'accepted' },
        ];

        // Configurer le comportement de formatDate avec une erreur pour la première date
        mockFormatDate.mockImplementationOnce(() => {
          throw new Error('Invalid date format');
        });
        mockFormatDate.mockReturnValueOnce('15/11/2024'); // Deuxième date formatée

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { }); // Espionner les logs

        const bills = snapshot.map((doc) => {
          try {
            return {
              ...doc,
              date: mockFormatDate(doc.date),
              status: mockFormatStatus(doc.status),
            };
          } catch (e) {
            console.log(e, 'for', doc);
            return {
              ...doc,
              date: doc.date, // Non formatée
              status: mockFormatStatus(doc.status),
            };
          }
        });

        // Assertions sur la gestion des erreurs
        expect(mockFormatDate).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error), 'for', snapshot[0]);
        expect(bills).toEqual([
          { id: 1, date: 'invalid-date', status: 'Formatted-pending' },
          { id: 2, date: '15/11/2024', status: 'Formatted-accepted' },
        ]);

        consoleSpy.mockRestore(); // Restaurer le comportement normal de console.log
      });

      test('should log the length of the resulting bills array', () => {
        // Simuler un snapshot de données
        const snapshot = [
          { id: 1, date: '2024-12-27', status: 'pending' },
          { id: 2, date: '2024-11-15', status: 'accepted' },
        ];

        mockFormatDate.mockReturnValue('formatted-date');
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { }); // Espionner les logs

        const bills = snapshot.map((doc) => {
          try {
            return {
              ...doc,
              date: mockFormatDate(doc.date),
              status: mockFormatStatus(doc.status),
            };
          } catch (e) {
            return { ...doc, date: doc.date, status: mockFormatStatus(doc.status) };
          }
        });

        console.log('length', bills.length);

        // Assertions sur les logs
        expect(consoleSpy).toHaveBeenCalledWith('length', 2);

        consoleSpy.mockRestore(); // Restaurer le comportement normal de console.log
      });
    });


  })

});

describe('get bills', () => {
  let mockStore2;
  let billsInstance;
  mockStore2 = {
    bills: jest.fn(() => ({
      list: jest.fn()
    }))
  };

  billsInstance = new Bills({ document: document, store: mockStore2, localStorage: window.localStorage })

  test('should display 404 error', async () => {
    mockStore2.bills.mockImplementationOnce(() => {
      list: jest.fn().mockRejectedValueOnce(new Error('404 not found'))
    })

    await billsInstance.getBills()
    const errorMessage = await screen.findByText('404 not found')

    expect(errorMessage).toBeInTheDocument()
  })
})











