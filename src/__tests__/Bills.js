/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { mockStore } from "../__mocks__/store.js";
import router from "../app/Router.js";
import { ROUTES_PATH } from "../constants/routes.js";
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
      console.log("LES DATES LA =>", datesSorted, dates)
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
      expect($.fn.modal).toHaveBeenCalledWith('show');
    });

  });
})











